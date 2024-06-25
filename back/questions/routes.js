const { Question } = require("./model");

module.exports = (app) => {
  app.get("/questions", async (req, res) => {
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

  app.post("/question", async (req, res) => {
    try {
      const question = new Question(req.body);
      await question.save().catch((error) => console.log(error));
      res.send(question);
    } catch (error) {
      res.status;
    }
  });

  app.put("/question/:id", async (req, res) => {
    try {
      await Question.findByIdAndUpdate(req.params.id, req.body);
      res.send("Question updated");
    } catch (error) {
      res.status(500).send;
    }
  });

  app.delete("/question/:id", async (req, res) => {
    try {
      await Question.findByIdAndDelete(req.params.id);
      res.send("Question deleted");
    } catch (error) {
      res.status(500).send;
    }
  });
};
