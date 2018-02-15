const router = require("express").Router();
const crypto = require("crypto");
const pgp = require("pg-promise")();

/*
{ timestamp: '1518727895',
  token: '77b1e623407516a0db75a2bcc4ed4ad373edfcc09efb9e5da5',
  signature: 'be36e6c197de3ae17f7e4bd2261dc5df6c941470bb90dbac67185073a4cd9c00',
  domain: 'mg.rtm.fi',
  my_var_1: 'Mailgun Variable #1',
  'my-var-2': 'awesome',
  'message-headers': '[["Received", "by luna.mailgun.net with SMTP mgrt 8734663311733; Fri, 03 May 2013 18:26:27 +0000"], ["Content-Type", ["multipart/alternative", {"boundary": "eb663d73ae0a4d6c9153cc0aec8b7520"}]], ["Mime-Version", "1.0"], ["Subject", "Test deliver webhook"], ["From", "Bob <bob@mg.rtm.fi>"], ["To", "Alice <alice@example.com>"], ["Message-Id", "<20130503182626.18666.16540@mg.rtm.fi>"], ["X-Mailgun-Variables", "{\\"my_var_1\\": \\"Mailgun Variable #1\\", \\"my-var-2\\": \\"awesome\\"}"], ["Date", "Fri, 03 May 2013 18:26:27 +0000"], ["Sender", "bob@mg.rtm.fi"]]',
  'Message-Id': '<20130503182626.18666.16540@mg.rtm.fi>',
  recipient: 'alice@example.com',
  event: 'delivered',
  'body-plain': '' }
 */

const mailgunApiKey = process.env.MAILGUN_API_KEY;

const db = pgp(process.env.MAILGUN_PSQL_CONN_URL);

const checkSig = (timestamp, token, signature) => {
  if (timestamp && token && signature) {
    const con = timestamp + token;
    const hash = crypto.createHmac("sha256", mailgunApiKey)
      .update(con)
      .digest("hex");
    return signature === hash;
  } else {
    return false;
  }
};

router.post("/", async (req, res) => {
  const { timestamp, token, signature, event, recipient, tag, error, reason, description } = req.body;
  if (checkSig(timestamp, token, signature)) {
    try {
      switch (event) {
        case "delivered":
        case "clicked":
        case "opened":
          await db.none(
            "INSERT INTO mailgun (event, tag, email, timestamp) VALUES ($1, $2, $3, to_timestamp($4))",
            [event, tag, recipient, timestamp]);
          break;

        case "bounced":
          await db.none(
            "INSERT INTO mailgun (event, tag, email, timestamp, error) VALUES ($1, $2, $3, to_timestamp($4), $5)",
            [event, tag, recipient, timestamp, error]);
          break;

        case "dropped":
          await db.none(
            "INSERT INTO mailgun (event, tag, email, timestamp, error) VALUES ($1, $2, $3, to_timestamp($4), $5)",
            [event, tag, recipient, timestamp, `${reason} - ${description}`]);
          break;

        default:

      }
    } catch (err) {
      console.error(err);
    }
  }
  res.sendStatus(200);
});

module.exports = router;