const router = require("express").Router();
const suuli = require("../lib/suuli");

const ttl = 43200;
const suuliAuthExpired = issued => {
  if (issued) {
    return new Date().getTime() - issued > ttl * 1000;
  } else {
    return true;
  }
};

const handleLogin = async (req, username, password) => {
  console.log("Logging in");
  const loginInfo = await suuli.login(username, password, ttl);
  Object.assign(req.session, { username, password, token: loginInfo.id, issued: new Date().getTime() });
};

router.post("/login", async (req, res, next) => {
  const {username, password} = req.body;
  if (username && password) {
    try {
      await handleLogin(req, username, password);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  } else {
    const err = new Error("Bad request");
    err.status = 400;
    next(err);
  }
});

router.use(async (req, res, next) => {
  if (suuliAuthExpired(req.session.issued)) {
    console.log("Suuli auth expired, refresh");
    const {username, password} = req.session;
    if (username && password) {
      try {
        await handleLogin(req, username, password);
        next();
      } catch (err) {
        next(err);
      }
    } else {
      console.error("Session didn't contain credentials, bailing out");
      const err = new Error("Unauthorized");
      err.status = 401;
      next(err);
    }
  } else {
    next();
  }
});

router.get("/berths", async (req, res) => {
  const berths = await suuli.getBerths(req.session.token);
  res.json(berths);
});

module.exports = router;
