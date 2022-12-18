"use strict";
const BoardModel = require("../models").Board;
const ThreadModel = require("../models").Thread;
const ReplyModel = require("../models").Reply;
const ObjectId = require("mongoose").Types.ObjectId;
module.exports = function (app) {
  app
    .route("/api/threads/:board")
    .post((req, res) => {
      const { text, delete_password } = req.body;
      const board = req.params.board;

      // console.log("post: ", req.body);
      const newThread = new ThreadModel({
        text: text,
        delete_password: delete_password,
        replies: [],
      });
      // console.log("newThread: ", newThread);
      BoardModel.findOne({ name: board }, (err, boardData) => {
        if (err) {
          res.json({ err });
          return;
        }
        if (!boardData) {
          const newBoard = new BoardModel({
            name: board,
            threads: [],
          });
          // console.log("newBoardData: ", newBoard);
          newBoard.threads.push(newThread);
          newBoard.save((err, data) => {
            if (err) {
              res.json({ err });
              return;
            }
            res.json(newThread);
            return;
          });
        } else {
          boardData.threads.push(newThread);
          boardData.save((err, data) => {
            if (err) {
              res.json({ err });
              return;
            }
            res.json(newThread);
            return;
          });
        }
      });
    })
    .get((req, res) => {
      const board = req.params.board;
      BoardModel.findOne({ name: board }, (err, data) => {
        if (!data) {
          let error = "No board with this name";
          // console.log(error);
          res.json({ error });
          return;
        }
        // console.log("data: ", data);
        const threads = data.threads.map((thread) => {
          let { _id, text, created_on, bumped_on, replies } = thread;
          replies = replies.map((reply) => {
            let { _id, text, created_on } = reply;
            return { _id, text, created_on };
          });
          const replycount = thread.replies.length;
          return {
            _id,
            text,
            created_on,
            bumped_on,
            replies,
            replycount,
          };
        });
        res.json(threads);
      });
    })
    .put((req, res) => {
      // console.log("put: ", req.body);
      const { thread_id } = req.body;
      const board = req.params.board;
      BoardModel.findOne({ name: board }, (err, boardData) => {
        if (err) {
          res.json({ err });
          return;
        }
        if (!boardData) {
          res.json({ error: "Board not found" });
          return;
        }
        const date = new Date();
        let reportedThread = boardData.threads.id(thread_id);
        reportedThread.reported = true;
        reportedThread.bumped_on = date;
        boardData.save((err, updatedData) => {
          if (err) {
            res.json({ err });
            return;
          }

          res.send("reported");
        });
      });
    })
    .delete((req, res) => {
      // console.log("delete: ", req.body);
      const { thread_id, delete_password } = req.body;
      const board = req.params.board;
      BoardModel.findOne({ name: board }, (err, boardData) => {
        if (err) {
          res.json({ err });
          return;
        }
        if (!boardData) {
          res.json({ error: "Board not found" });
          return;
        }
        let threadToDelete = boardData.threads.id(thread_id);
        if (threadToDelete.delete_password !== delete_password) {
          res.send("incorrect password");
          return;
        }
        threadToDelete.remove();
        boardData.save((err, updatedData) => {
          if (err) {
            res.json({ err });
            return;
          }
          res.send("success");
        });
      });
    });

  app
    .route("/api/replies/:board")
    .post((req, res) => {
      // console.log("post: ", req.body);
      const { thread_id, text, delete_password } = req.body;
      const board = req.params.board;
      const date = new Date();
      const newReply = new ReplyModel({
        text: text,
        delete_password: delete_password,
        created_on: date,
        bumped_on: date,
        reported: false,
      });
      BoardModel.findOne({ name: board }, (err, boardData) => {
        if (err) {
          res.json({ err });
          return;
        }
        if (!boardData) {
          res.json({ error: "Board not found" });
          return;
        }
        let threadToAddReply = boardData.threads.id(thread_id);
        threadToAddReply.bumped_on = date;
        threadToAddReply.replies.push(newReply);
        boardData.save((err, updatedData) => {
          if (err) {
            res.json({ err });
            return;
          }
          res.json(updatedData);
          return;
        });
      });
    })
    .get((req, res) => {
      // console.log("get1: ", req.params);
      // console.log("get2: ", req.query);
      const board = req.params.board;
      const thread_id = req.query.thread_id;
      BoardModel.findOne({ name: board }, (err, data) => {
        if (err) {
          res.json({ err });
          return;
        }
        if (!data) {
          res.json({ error: "No board with this name" });
          return;
        }
        // console.log({ data });
        const thread = data.threads.id(thread_id);
        // console.log({ thread });
        let { _id, text, created_on, bumped_on, replies } = thread;
        replies = replies.map((reply) => {
          let { _id, text, created_on } = reply;
          return { _id, text, created_on };
        });
        const resJson = { _id, text, created_on, bumped_on, replies };
        res.json(resJson);
      });
    })
    .put((req, res) => {
      const { thread_id, reply_id } = req.body;
      const board = req.params.board;
      BoardModel.findOne({ name: board }, (err, data) => {
        if (err) {
          res.json({ err });
          return;
        }
        if (!data) {
          res.json({ error: "No board with this name" });
          return;
        }
        let thread = data.threads.id(thread_id);
        let reply = thread.replies.id(reply_id);
        reply.reported = true;
        reply.bumped_on = new Date();
        data.save((err, updatedData) => {
          if (err) {
            res.json({ err });
            return;
          }
          res.send("reported");
        });
      });
    })
    .delete((req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      const board = req.params.board;
      BoardModel.findOne({ name: board }, (err, data) => {
        if (err) {
          res.json({ err });
          return;
        }
        if (!data) {
          res.json({ error: "No board with this name" });
          return;
        }
        let thread = data.threads.id(thread_id);
        let reply = thread.replies.id(reply_id);
        if (reply.delete_password !== delete_password) {
          res.send("incorrect password");
          return;
        }
        reply.text = "[deleted]";
        data.save((err, updatedData) => {
          if (err) {
            res.json({ err });
            return;
          }
          res.send("success");
        });
      });
    });
};
