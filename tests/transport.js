const tap		= require("tap");
const MediaServer	= require("../index");
const SemanticSDP	= require("semantic-sdp");

MediaServer.enableLog(false);
MediaServer.enableDebug(false);
MediaServer.enableUltraDebug(false);
const endpoint = MediaServer.createEndpoint("127.0.0.1");

const DTLSInfo		= SemanticSDP.DTLSInfo;
const ICEInfo		= SemanticSDP.ICEInfo;
const Setup		= SemanticSDP.Setup;
const Direction		= SemanticSDP.Direction;


function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

Promise.all([
	tap.test("Transport",async function(suite){


		const localEndpoint = MediaServer.createEndpoint ("127.0.0.1");
		const remoteEndpoint = MediaServer.createEndpoint ("127.0.0.1");
		
		const localInfo = {
			dtls		: new DTLSInfo(Setup.ACTIVE,"sha-256",localEndpoint.getDTLSFingerprint()),
			ice		: ICEInfo.generate(true),
		};
		const remoteInfo = {
			dtls		: new DTLSInfo(Setup.PASSIVE,"sha-256",remoteEndpoint.getDTLSFingerprint()),
			ice		: ICEInfo.generate(true),
		};

		suite.test("dtls",async function(test){
			test.plan(2);
			//Create transports
			const sender = localEndpoint.createTransport (localInfo,remoteInfo,{disableSTUNKeepAlive: true});
			const receiver = remoteEndpoint.createTransport (remoteInfo,localInfo,{disableSTUNKeepAlive: true});
			//wait for dtls events
			sender.once("dtlsstate",(state)=>{
				test.same(state,"connected");
			});
			receiver.once("dtlsstate",(state)=>{
				test.same(state,"connected");
			});
			//Add candidates
			sender.addRemoteCandidate(remoteEndpoint.getLocalCandidates()[0]);
			receiver.addRemoteCandidate(localEndpoint.getLocalCandidates()[0]);
			
			await sleep(1000);
			
			sender.stop();
			receiver.stop();
		});
		
		suite.end();
	}),
	tap.test("Probing",async function(suite){

		//Init test
		const transport = endpoint.createTransport({
			dtls : SemanticSDP.DTLSInfo.expand({
				"hash"        : "sha-256",
				"fingerprint" : "F2:AA:0E:C3:22:59:5E:14:95:69:92:3D:13:B4:84:24:2C:C2:A2:C0:3E:FD:34:8E:5E:EA:6F:AF:52:CE:E6:0F"
			}),
			ice  : SemanticSDP.ICEInfo.generate()
		});

		suite.test("getStats",async function(test){
			//Create new incoming stream
			const stats = transport.getStats();
			test.ok(stats);
			test.done();
		});

		suite.test("setBandwidthProbing",async function(test){
			//Create new incoming stream
			transport.setBandwidthProbing(true);
			transport.setBandwidthProbing(false);
			transport.setBandwidthProbing(1);
			transport.setBandwidthProbing(0);
			test.done();
		});

		suite.test("setMaxProbingBitrate",async function(test){
			//Create new incoming stream
			transport.setBandwidthProbing(1000);
			test.done();
		});

		suite.end();
	}),
	tap.test("Tracks::create",async function(suite){

		//Init test
		const transport = endpoint.createTransport({
			dtls : SemanticSDP.DTLSInfo.expand({
				"hash"        : "sha-256",
				"fingerprint" : "F2:AA:0E:C3:22:59:5E:14:95:69:92:3D:13:B4:84:24:2C:C2:A2:C0:3E:FD:34:8E:5E:EA:6F:AF:52:CE:E6:0F"
			}),
			ice  : SemanticSDP.ICEInfo.generate()
		});

		suite.test("incoming",async function(test){
			//Create new incoming stream
			const incomingStreamTrack = transport.createIncomingStreamTrack("audio");
			test.ok(incomingStreamTrack);
		});

		suite.test("outgoing",async function(test){
			//Create new incoming stream
			const outgoingStreamTrack = transport.createOutgoingStreamTrack("video");
			test.ok(outgoingStreamTrack);
		});

		suite.end();
	}),
	tap.test("Stop",async function(suite){


		suite.test("Transport::stop()",async function(test){
			test.plan(2);
			//Init test
			const transport = endpoint.createTransport({
				dtls : SemanticSDP.DTLSInfo.expand({
					"hash"        : "sha-256",
					"fingerprint" : "F2:AA:0E:C3:22:59:5E:14:95:69:92:3D:13:B4:84:24:2C:C2:A2:C0:3E:FD:34:8E:5E:EA:6F:AF:52:CE:E6:0F"
				}),
				ice  : SemanticSDP.ICEInfo.generate()
			});
			//Listen event
			transport.once("stopped",()=>{
				//Create new incoming stream
				test.pass();
			});
			//Stop it
			transport.stop();
			//OK
			test.pass();

		});

		suite.test("Endooint::stop",async function(test){
			const endpoint = MediaServer.createEndpoint("127.0.0.1");

			test.plan(2);
			//Init test
			const transport = endpoint.createTransport({
				dtls : SemanticSDP.DTLSInfo.expand({
					"hash"        : "sha-256",
					"fingerprint" : "F2:AA:0E:C3:22:59:5E:14:95:69:92:3D:13:B4:84:24:2C:C2:A2:C0:3E:FD:34:8E:5E:EA:6F:AF:52:CE:E6:0F"
				}),
				ice  : SemanticSDP.ICEInfo.generate()
			});
			//Listen event
			transport.once("stopped",()=>{
				//Create new incoming stream
				test.pass();
			});
			//Stop it
			endpoint.stop();
			//OK
			test.pass();
		});

		suite.end();
	})
])
.then(()=>{
	MediaServer.terminate ();
});
