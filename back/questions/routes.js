const { authMiddleware } = require("../auth/middleware");
const { Question } = require("./model");

module.exports = (app) => {
  app.get("/questions", authMiddleware, async (req, res) => {
    try {
      const questions = await Question.find();
      res.send(questions);
    } catch (error) {
      res.status(500).send;
    }
  });

  app.get("/question", async (req, res) => {
    try {
      const question = await Question.aggregate([{ $sample: { size: 1 } }]);
      res.send(question);
    } catch (error) {
      res.status(500).send;
    }
  });

  app.post("/question", authMiddleware, async (req, res) => {
    try {
      const question = new Question(req.body);
      await question.save().catch((error) => console.log(error));
      res.send(question);
    } catch (error) {
      res.status;
    }
  });

  app.put("/question/:id", authMiddleware, async (req, res) => {
    try {
      await Question.findByIdAndUpdate(req.params.id, req.body);
      res.send({message: "Question updated"});
    } catch (error) {
      res.status(500).send;
    }
  });

  app.delete("/question/:id", authMiddleware, async (req, res) => {
    try {
      await Question.findByIdAndDelete(req.params.id);
      res.send({message: "Question deleted"});
    } catch (error) {
      res.status(500).send;
    }
  });

  app.get('/question/isthere', async (req, res) => {
    try {
      const questions = await Question.find();
      res.send({isthere: questions.length > 0});
    } catch (error) {
      res.status(500).send;
    }
  });
};
