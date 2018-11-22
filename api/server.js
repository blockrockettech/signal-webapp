'use strict';

// @author Akash Singh
// BASED ON: https://github.com/akash4393/libsignal-javascript-example

/*
* Sample Node server for signal
*/

/*
registerKeys - get keys (initial key packet and preKeys) from client.
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
lookupKeys - send keys packet to a client that requests for it
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

app.post('/api/keys/register', registerKeys);
app.post('/api/keys/lookup', lookupKeys);
app.post('/api/send/message', storeIncomingMessage);
app.post('/api/get/message', forwardMessageToClient);
app.get('/api/get/message/:id', retrieveRecipientMessage);

const constants = {
    INIT: 'init',
    PRE_KEYS: 'pre-keys'
};

const storageMap = {};
const messageStorageMap = {};
const recipientMessageStorageMap = {};

function registerKeys (req, res) {
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
    console.log('--- KEY MAP ---');
    console.log(storageMap);
    console.log('--- KEY MAP ---');
    console.log('\n');
}

function lookupKeys (req, res) {
    const {registrationId, deviceId} = req.body;
    const storageKey = `${registrationId.toString()}|${deviceId.toString()}`;

    let responseObject;
    if (storageMap[storageKey]) {

        responseObject = JSON.parse(JSON.stringify(storageMap[storageKey]));
        // responseObject.preKey = responseObject.preKeys[responseObject.preKeys.length - 1];
        // storageMap[storageKey].pop(); // TODO is this needed or can we use the same pre-key?

    } else {
        responseObject = {err: 'Keys for ' + storageKey + ' user does not exist'};
    }

    console.log('\n');
    console.log('--- KEY ---');
    console.log(responseObject);
    console.log('--- KEY ---');
    console.log('\n');

    res.json(responseObject);
}

function storeIncomingMessage (req, res) {
    let reqObj = req.body;
    let messageStorageKey = `${reqObj.messageTo.toString()}-${reqObj.messageFrom.toString()}`;

    const recipient = reqObj.messageTo.toString();

    //FIXME stack the messages as only saves the last one...
    messageStorageMap[messageStorageKey] = reqObj;

    if (!recipientMessageStorageMap[recipient]) {
        recipientMessageStorageMap[recipient] = [];
    }

    recipientMessageStorageMap[recipient].push(reqObj);

    console.log('\n');
    console.log('--- MESSAGES ---');
    console.log(messageStorageMap);
    console.log('--- MESSAGES ---');
    console.log('\n');

    console.log('\n');
    console.log('--- RECIPIENT MESSAGES ---');
    console.log(recipientMessageStorageMap);
    console.log('--- RECIPIENT MESSAGES ---');
    console.log('\n');

    res.sendStatus(200);
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

function retrieveRecipientMessage (req, res) {

    console.log(`retrieveRecipientMessage for ${req.params.id}`);
    if (recipientMessageStorageMap[req.params.id]) {
        let messages = recipientMessageStorageMap[req.params.id];
        if (messages && messages.length > 0) {
            const mes = messages.shift();
            console.log('\n');
            console.log('--- MESSAGE ---');
            console.log(mes);
            console.log('--- MESSAGE ---');
            console.log('\n');
            return res.json(mes);
        }
    }

    return res.sendStatus(204);
}