/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var APIActionCreator = require('../../src/APIActionCreator.es6');
var dispatcher = require('../../src/dispatcherInstance.es6');

describe('APIActionCreators', function () {

	it('should expose methods passed to their constructor', function () {
        var aac = new APIActionCreator({
			displayName: 'api1',
            doThing: {
                method: 'GET',
                route: '/cat',
                pending: 'TEST_' + Math.random(),
            },
            doOtherThing: {
                method: 'POST',
                route: '/dog',
                pending: 'TEST_' + Math.random()
            }
        });

        Should.exist(aac.doThing);
        Should.exist(aac.doOtherThing);
    });

    it('should be given a request object after being called', function () {
        var aac = new APIActionCreator({
            displayName: 'api45',
            doThing: {
                route: '/mirror',
                method: 'POST',
                pending: 'TEST_' + Math.random()
            }
        });

        var request = aac.doThing();
        Should.exist(request);
        Should.exist(request.abort);
    });

    it('should call handleSuccess on a successful request', function (done) {
        var aac = new APIActionCreator({
			displayName: 'api2',
            doThing: {
                route: '/mirror',
                method: 'POST',
                pending: 'TEST_' + Math.random(),
                handleSuccess: function () {
                    done();
                },
                handleFailure: function (req, res) {
                    done(req.error || res.error || new Error('Request failed'));
                }
            }
        });

        aac.doThing();
    });

    it('should not parse the body as JSON with a mimetype of "text/plain"', function (done) {
        var aac = new APIActionCreator({
            displayName: 'api' + Math.random(),
            doThing: {
                route: '/mirror',
                method: 'POST',
                createRequest: function () {
                    return {
                        query: {
                            contentType: 'text/plain'
                        }
                    };
                },
                handleSuccess: function (req, res) {
                    res.body.should.be.type('string');
                    done();
                },
                handleFailure: function (req, res) {
                    done(req.error || res.error || new Error('Request failed'));
                }
            }
        });

        aac.doThing();
    });

    it('should parse the body as JSON with a mimetype of "application/json"', function (done) {
        var aac = new APIActionCreator({
            displayName: 'api' + Math.random(),
            doThing: {
                route: '/mirror',
                method: 'POST',
                createRequest: function () {
                    return {
                        query: {
                            contentType: 'application/json'
                        }
                    };
                },
                handleSuccess: function (req, res) {
                    res.body.should.be.type('object');
                    done();
                },
                handleFailure: function (req, res) {
                    done(req.error || res.error || new Error('Request failed'));
                }
            }
        });

        aac.doThing();
    });

    it('should parse the body as JSON with a mimetype of "application/json; charset=utf-8"', function (done) {
        var aac = new APIActionCreator({
            displayName: 'api' + Math.random(),
            doThing: {
                route: '/mirror',
                method: 'POST',
                createRequest: function () {
                    return {
                        query: {
                            contentType: 'application/json; charset=utf-8'
                        }
                    };
                },
                handleSuccess: function (req, res) {
                    res.body.should.be.type('object');
                    done();
                },
                handleFailure: function (req, res) {
                    done(req.error || res.error || new Error('Request failed'));
                }
            }
        });

        aac.doThing();
    });

    it('should call handleFailure on a failed request', function (done) {
        var aac = new APIActionCreator({
			displayName: 'api3',
            doThing: {
                route: '/bad-endpoint',
                method: 'POST',
                pending: 'TEST_' + Math.random(),
                handleSuccess: function () {
                    done(new Error('handleSuccess was called'));
                },
                handleFailure: function () {
                    done();
                }
            }
        });

        aac.doThing();
    });

    it('should call handleFailure when the application type is json but the payload is not valid JSON', function (done) {
        var aac = new APIActionCreator({
            displayName: 'api' + Math.random(),
            doThing: {
                route: '/invalid-json',
                method: 'GET',
                handleSuccess: function () {
                    done(new Error('handleSuccess was called'));
                },
                handleFailure: function (req, res) {
                    res.body.should.equal('hello world');
                    res.error.should.be.instanceOf(Error);
                    done();
                }
            }
        });

        aac.doThing();
    });

    it('should call handleAbort on a aborted request', function (done) {
        var aac = new APIActionCreator({
            displayName: 'api55',
            doThing: {
                route: '/long-time',
                method: 'POST',
                handleSuccess: function () {
                    done(new Error('handleSuccess was called'));
                },
                handleFailure: function () {
                    done(new Error('handleFailure was called'));
                },
                handleAbort: function () {
                    done();
                }
            }
        });

        var r = aac.doThing();
        r.abort();
    });

    it('should transform a request with createRequest', function (done) {
        var query = {};
		var clonedQuery = {};

        var aac = new APIActionCreator({
			displayName: 'api4',
            doThing: {
                route: '/mirror',
                method: 'POST',
                pending: 'TEST_' + Math.random(),
                createRequest: function (a, b) {
                    query.a = a;
                    query.b = b;

					// setup cloned query for equality
					clonedQuery.a = a;
					clonedQuery.b = b;
                    return {
                        query: query
                    };
                },
                handleSuccess: function (req, res) {
                    try {
                        req.query.should.eql(clonedQuery);
                        res.body.query.should.eql(clonedQuery);
                        done();
                    }
                    catch(err) {
                        done(err);
                    }
                },
                handleFailure: function (req, res) {
                    done(req.error || res.error || new Error('Request failed'));
                }
            }
        });

        aac.doThing('hi', 'mom');
    });

	it('should throw an error for passing args without create request', function () {
		(function () {
			var aac = new APIActionCreator({
				displayName: 'api55',
				doThing: {
					route: '/mirror',
					method: 'POST',
					pending: 'TEST_' + Math.random()
				}
			});
			aac.doThing('hi', 'mom');
		}).should.throw();
	});

    it('should throw errors when route is missing', function () {
        (function () {
            new APIActionCreator({
				displayName: 'api5',
                doThing: {
                    method: 'POST',
                    pending: 'TEST_' + Math.random()
                }
            });
        }).should.throw();
    });

    it('should throw errors when method is missing', function () {
        (function () {
            new APIActionCreator({
				displayName: 'api6',
                doThing: {
                    route: '/dog',
                    penging: 'TEST_' + Math.random(),
                }
            });
        }).should.throw();
    });

    describe('when making the api call', function () {
        var token;
        var pending;
        var success;
        var failure;
        var abort;
        var query;
        var aac;

        beforeEach(function () {
            pending = 'PENDING_' + Math.random();
            success = 'SUCCESS_' + Math.random();
            failure = 'FAILURE_' + Math.random();
            abort = 'ABORT_' + Math.random();

            query = {};
            aac = new APIActionCreator({
				displayName: String(Math.random()),
                doThing: {
                    route: '/cat',
                    method: 'GET',
                    pending: pending,
                    success: success,
                    createRequest: function (a, b) {
                        query.a = a;
                        query.b = b;
                        return {
                            query: query
                        };
                    }
                },
                doThingFailureTest: {
                    route: '/cat',
                    method: 'GET',
                    failure: failure,
                    createRequest: function (a, b) {
                        query.a = a;
                        query.b = b;
                        return {
                            query: query
                        };
                    }
                },
                doBrokenThing: {
                    route: '/bad',
                    method: 'GET',
                    failure: failure
                },
                doAbortThing: {
                    route: '/long-time',
                    method: 'POST',
                    abort: abort
                },

            });
        });

        afterEach(function () {
            dispatcher.unregister(token);
        });

        it('should not send the failure type when success response without success type', function (done) {
            // https://github.com/addthis/fluxthis/issues/121
            token = dispatcher.register(function (action) {
                done(new Error('an action should not have been dispatched'));
            });


            aac.doThingFailureTest();
            setTimeout(done, 1500);
        });

        it('should dispatch the pending action when making the call', function (done) {

            token = dispatcher.register(function (action) {
                if(action.type === pending) {
                    done();
                }
            });

            aac.doThing('hi','mom');
        });

        it('should dispatch the successful action after succeeding with the call', function (done) {

            token = dispatcher.register(function (action) {
                if(action.type === success) {
                    done();
                }
            });

            aac.doThing('hi','mom');
        });

        it('should dispatch the failure action after failing with the call', function (done) {

            token = dispatcher.register(function (action) {
                if(action.type === failure) {
                    done();
                }
            });

            aac.doBrokenThing();
        });


        it('should dispatch the abort action after failing with the call', function (done) {

            token = dispatcher.register(function (action) {
                if(action.type === abort) {
                    done();
                }
            });

            var r = aac.doAbortThing();
            r.abort();
        });
    });


});