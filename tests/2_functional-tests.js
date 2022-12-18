const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");

chai.use(chaiHttp);

let testThread_id;
let testThread_text;
let testThread_password;
let testReply_id;
let testReply_text;
let testReply_password;

suite("Functional Tests", function () {
  this.timeout(5000);

  test("1: Creating a new thread: POST request to /api/threads/{board}", function (done) {
    let text = "test text";
    let delete_password = "test";
    let expect = {
      text: text,
      delete_password: delete_password,
      reported: false,
    };
    chai
      .request(server)
      .post("/api/threads/testboard")
      .set("content-type", "application/json")
      .send({ text, delete_password })
      .end(function (err, res) {
        testThread_id = res.body._id;
        testThread_text = res.body.text;
        testThread_password = res.body.delete_password;
        assert.equal(res.status, 200);
        assert.equal(res.body.text, expect.text);
        assert.equal(res.body.delete_password, expect.delete_password);
        assert.equal(res.body.reported, expect.reported);
        done();
      });
  });
  test("2: Creating a new reply: POST request to /api/replies/{board}", function (done) {
    let thread_id = testThread_id;
    let text = "test reply";
    let delete_password = "testreply";
    let expect = {
      text: text,
      delete_password: delete_password,
      reported: false,
    };
    chai
      .request(server)
      .post("/api/replies/testboard")
      .set("content-type", "application/json")
      .send({ thread_id, text, delete_password })
      .end(function (err, res) {
        testReply_id = res.body.threads[0].replies[0]._id;
        testReply_text = res.body.threads[0].replies[0].text;
        testReply_password = res.body.threads[0].replies[0].delete_password;
        assert.equal(res.status, 200);
        assert.equal(res.body.threads[0].replies[0].text, expect.text);
        assert.equal(
          res.body.threads[0].replies[0].delete_password,
          expect.delete_password
        );
        assert.equal(res.body.threads[0].replies[0].reported, expect.reported);
        done();
      });
  });

  test("3: Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}", function (done) {
    let text = testThread_text;
    let expect = {
      text: text,
      delete_password: "delete_password is undefined",
      reported: "reported is undefined",
    };
    chai
      .request(server)
      .get("/api/threads/testboard")
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.exists(res.body[0], "There is a thread");
        assert.equal(res.body[0].text, expect.text);
        assert.notExists(res.body[0].delete_password, expect.delete_password);
        assert.notExists(res.body[0].reported, expect.reported);
        assert.notExists(
          res.body[0].replies[0].delete_password,
          expect.delete_password
        );
        assert.notExists(res.body[0].replies[0].reported, expect.reported);
        done();
      });
  });
  test("4: Viewing a single thread with all replies: GET request to /api/replies/{board}", function (done) {
    let thread_id = testThread_id;
    let thread_text = testThread_text;
    let reply_text = testReply_text;
    let expect = {
      _id: thread_id,
      threadText: thread_text,
      replyText: reply_text,
      delete_password: "delete_password is undefined",
      reported: "reported is undefined",
    };
    chai
      .request(server)
      .get("/api/replies/testboard")
      .set("content-type", "application/json")
      .query({ thread_id })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body._id, expect._id);
        assert.equal(res.body.text, expect.threadText);
        assert.notExists(res.body.delete_password, expect.delete_password);
        assert.notExists(res.body.reported, expect.reported);
        assert.equal(res.body.replies[0].text, expect.replyText);
        assert.notExists(
          res.body.replies[0].delete_password,
          expect.delete_password
        );
        assert.notExists(res.body.replies[0].reported, expect.reported);
        done();
      });
  });
  test("5: Reporting a thread: PUT request to /api/threads/{board}", function (done) {
    let thread_id = testThread_id;
    let expect = {
      text: "reported",
    };
    chai
      .request(server)
      .put("/api/threads/testboard")
      .set("content-type", "application/json")
      .send({ thread_id })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, expect.text);
        done();
      });
  });
  test("6: Reporting a reply: PUT request to /api/replies/{board}", function (done) {
    let thread_id = testThread_id;
    let reply_id = testReply_id;
    let expect = {
      text: "reported",
    };
    chai
      .request(server)
      .put("/api/replies/testboard")
      .set("content-type", "application/json")
      .send({ thread_id, reply_id })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, expect.text);
        done();
      });
  });
  test("7: Deleting a reply with the incorrect password: DELETE request to /api/replies/{board}", function (done) {
    let thread_id = testThread_id;
    let reply_id = testReply_id;
    let delete_password = "wrong";
    let expect = {
      text: "incorrect password",
    };
    chai
      .request(server)
      .delete("/api/replies/testboard")
      .set("content-type", "application/json")
      .send({ thread_id, reply_id, delete_password })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, expect.text);
        done();
      });
  });
  test("8: Deleting a thread with the incorrect password: DELETE request to /api/threads/{board}", function (done) {
    let thread_id = testThread_id;
    let delete_password = "wrong";
    let expect = {
      text: "incorrect password",
    };
    chai
      .request(server)
      .delete("/api/threads/testboard")
      .set("content-type", "application/json")
      .send({ thread_id, delete_password })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, expect.text);
        done();
      });
  });

  test("9: Deleting a reply with the correct password: DELETE request to /api/replies/{board}", function (done) {
    let thread_id = testThread_id;
    let reply_id = testReply_id;
    let delete_password = testReply_password;
    let expect = {
      text: "success",
    };
    chai
      .request(server)
      .delete("/api/replies/testboard")
      .set("content-type", "application/json")
      .send({ thread_id, reply_id, delete_password })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, expect.text);
        done();
      });
  });
  test("10: Deleting a thread with the correct password: DELETE request to /api/threads/{board}", function (done) {
    let thread_id = testThread_id;
    let delete_password = testThread_password;
    let expect = {
      text: "success",
    };
    chai
      .request(server)
      .delete("/api/threads/testboard")
      .set("content-type", "application/json")
      .send({ thread_id, delete_password })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, expect.text);
        done();
      });
  });
});
