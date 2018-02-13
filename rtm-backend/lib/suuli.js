const hostPath = "https://suuli.spv.fi";

const defaultHeaders = {
  "Accept-Language": "fi,en-US;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Accept": "application/json",
  "Referer": "https://suuli.spv.fi/",
  "Cache-Control" :"no-cache"
};

const authHeaders = token => ({
  ...defaultHeaders,
  authorization: token
});

const mkRequest = (path, method, token, body) => {
  const hdrs = authHeaders(token);
  const opts = {
    method
  };

  if (body) {
    hdrs["Content-Type"] = "application/json;charset=UTF-8";
    opts.body = JSON.stringify(body);
  }

  return new Request(`${hostPath}/${path}`, {
    ...opts,
    headers: new Headers(hdrs)
  });
};

const doFetch = async request => {
  return fetch(request).then(r => r.json());
};


const login = async (username, password, ttl) => {
  const loginResp = await fetch(new Request(`${hostPath}/api/People/login`, {
    method: "POST",
    headers: new Headers({
      ...defaultHeaders,
      "Content-Type": "application/json;charset=UTF-8"
    }),
    body: JSON.stringify({username, password, ttl})
  }));

  if (loginResp.ok) {
    const json = await loginResp.json();
    if (json.clubId !== 138) {
      const err = new Error("RTM required");
      err.status = 403;
      throw err;
    }
    return json;
  } else {
    const err = new Error(loginResp.statusText);
    err.status = loginResp.status;
    throw err;
  }
};

const getBerths = async token => {
  const query = {clubId: 138, berthNumber: ""};
  const resp = await doFetch(mkRequest(`api/Berths/search?query=${encodeURIComponent(JSON.stringify(query))}`, "GET", token));
  const map = {};
  resp.forEach(r => {
    const {id, berthNumber, berthType, boatName, customerName, name, ownerId} = r;
    map[berthNumber] = {id, berthNumber, berthType, boatName, customerName, name, ownerId};
  });
  return map;
};

module.exports = {
  getBerths, login
};
