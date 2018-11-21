'use strict';

// @author Akash Singh

/*
* Sample Node server for signal
*/

/*
receiveKeys - get keys (initial key packet and preKeys) from client.
Initial/Registration Packet:
req.body = {
	type: 'init'
	deviceId: <int>,
	registrationId: <int>,
	identityKey: <str>,
	signedPreKey: {
		id: <int>,
		key: <str>,
		signature: <str>
	},
	preKeys: [
		{
			id: <int>,
			key: <str>
		},
		{
			id: <int>,
			key: <str>
		},
		...
	]
}
Pre Keys Packet:
req.body = {
	type: 'pre-keys'
	deviceId: <int>,
	registrationId: <int>,
	preKeys: [
		{
			id: <int>,
			key: <str>
		},
		{
			id: <int>,
			key: <str>
		},
		...
	]
}
*/

/*
sendKeys - send keys packet to a client that requests for it
Get initial request:
req.body = {
	type: 'init'
	deviceId: <int>,
	registrationId: <int>
}
Get preKeys request:
req.body = {
	type: 'pre-keys'
	deviceId: <int>,
	registrationId: <int>
}
*/

/*
messageStoreMap = {
	'recipients regId + recipients devId' + sender's regId + sender's devId: {
		to: {
			registrationId: <recipient's regId>,
			deviceId: <recipient's devId>
		},
		from: {
			registrationId: <sender's regId>,
			deviceId: <sender's devId>
		},
		ciphertextMessage: {
			type: <int>,
			body: <signal enc text>,
			registrationId: <int>
		}
	}
}
*/

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.use(express.json({strict: true}));

app.listen(3000, () => console.log('listening on 3000'));

app.post('/api/keys/register', receiveKeys);
app.post('/api/keys/lookup', sendKeys);
app.post('/api/send/message', storeIncomingMessage);
app.post('/api/get/message', forwardMessageToClient);

const constants = {
    INIT: 'init',
    PRE_KEYS: 'pre-keys'
};

var storageMap = {};
var messageStorageMap = {};

function receiveKeys (req, res) {
    const reqObj = req.body;
    const {registrationId, deviceId} = reqObj;
    const storageKey = `${registrationId.toString()}|${deviceId.toString()}`;

    if (storageMap[storageKey]) {
        res.json({err: 'Init packet for this user already exists'});
    } else {
        storageMap[storageKey] = reqObj;
        res.json({msg: 'Initial packet successfully saved'});
    }
    console.log('\n');
    console.log('storageMap~~~~~~~');
    console.log(storageMap);
    console.log('\n');
}

function sendKeys (req, res) {
    const {registrationId, deviceId} = req.body;
    const storageKey = `${registrationId.toString()}|${deviceId.toString()}`;

    let responseObject;
    if (storageMap[storageKey]) {

        responseObject = JSON.parse(JSON.stringify(storageMap[storageKey]));
        // responseObject.preKey = responseObject.preKeys[responseObject.preKeys.length - 1];
        // storageMap[storageKey].pop(); // TODO is this needed or can we use the same pre-key?

    } else {
        responseObject = {
            err: 'Keys for ' + storageKey + ' user does not exist'
        };
    }
    console.log(responseObject);
    res.json(responseObject);
}

function storeIncomingMessage (req, res) {
    let reqObj = req.body;
    let messageStorageKey = `${reqObj.messageTo.toString()}-${reqObj.messageFrom.toString()}`;
    //FIXME stack the messages as only saves the last one...
    messageStorageMap[messageStorageKey] = reqObj;
    res.json({msg: 'Message successfully saved'});
    console.log('\n');
    console.log('~~~~~~~messageStorageMap~~~~~~~');
    console.log(messageStorageMap);
}

function forwardMessageToClient (req, res) {
    let reqObj = req.body;
    let messageStorageKey = `${reqObj.messageTo.toString()}-${reqObj.messageFrom.toString()}`;
    let responseObject;
    if (messageStorageMap[messageStorageKey]) {

        responseObject = messageStorageMap[messageStorageKey];
        responseObject.messageFrom = reqObj.messageFrom.toString();
        responseObject.messageTo = reqObj.messageTo.toString();

    } else {
        responseObject = {err: `MSG ERROR: ${reqObj.messageTo.toString()}-${reqObj.messageFrom.toString()}`};
    }

    res.json(responseObject);
}
