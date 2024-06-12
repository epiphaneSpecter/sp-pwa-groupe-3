const express = require('express')
const webPush = require("web-push");
const bodyParser = require('body-parser');
const app = express()
const cors = require('cors');

require('dotenv').config()

// CORS options
const corsOptions = {
  origin: '*', 
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(bodyParser.json());

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.log(
    "You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY " +
      "environment variables. You can use the following ones:"
  );
  console.log(webPush.generateVAPIDKeys());
  
}

const baseRoute = '/push-server/'

webPush.setVapidDetails(
  "mailto:folly.avlah@etu.unistra.fr",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

app.get('/push-server', function (req, res) {
  res.send('Hello World!')
})
 

app.get(baseRoute + "vapidPublicKey", function (req, res) {
  res.send(process.env.VAPID_PUBLIC_KEY);
});

app.post(baseRoute + "register", function (req, res) {
  res.sendStatus(201);
});

app.post(baseRoute + "sendNotification", function (req, res) {
  const subscription = req.body.subscription;
  const payload = req.body.payload;
  const options = {
    TTL: req.body.ttl,
  };

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
  });

  setTimeout(function () {
    webPush
      .sendNotification(subscription, notificationPayload, options)
      .then(function () {
        res.sendStatus(201);
      })
      .catch(function (error) {
        console.log(error);
        res.sendStatus(500);
      });
  }, req.body.delay);
});


 
app.listen(process.env.PORT, process.env.IP, function () {
  console.log('Example app started!', process.env.PORT)
})