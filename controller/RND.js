const express = require('express');
const rnd = require('../model/rnd');
const router = express.Router();
const rndUserresponse = require('../model/rndUserresponce');

router.post('/insert-question', async (req, res) => {
    const {category,type, question, ans1, ans2, ans3, ans4, ans5, ans6, ans7, ans8, ans9, ans10, ans1_score,
        ans2_score,
        ans3_score,
        ans4_score,
        ans5_score,
        ans6_score,
        ans7_score,
        ans8_score,
        ans9_score,
        ans10_score } = req.body;

    try {
        const newQuestion = await rnd.create({
            category,
            type,
            question,
            ans1,
            ans2,
            ans3,
            ans4,
            ans5,
            ans6,
            ans7,
            ans8,
            ans9,
            ans10,
            ans1_score,
            ans2_score,
            ans3_score,
            ans4_score,
            ans5_score,
            ans6_score,
            ans7_score,
            ans8_score,
            ans9_score,
            ans10_score
        });

        return res.status(201).json({
            message: 'Question inserted successfully!',
            data: newQuestion
        });
    } catch (error) {
        console.error('Error inserting question:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/get-questions', async (req, res) => {
    try {
      const questions = await rnd.findAll();
      
      const formattedQuestions = questions.map(q => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: {
          ans1: { label: q.ans1, score: q.ans1_score },
          ans2: { label: q.ans2, score: q.ans2_score },
          ans3: { label: q.ans3, score: q.ans3_score },
          ans4: { label: q.ans4, score: q.ans4_score },
          ans5: { label: q.ans5, score: q.ans5_score },
          ans6: { label: q.ans6, score: q.ans6_score },
          ans7: { label: q.ans7, score: q.ans7_score },
          ans8: { label: q.ans8, score: q.ans8_score },
          ans9: { label: q.ans9, score: q.ans9_score },
          ans10: { label: q.ans10, score: q.ans10_score }
        }
      }));
  
      return res.status(200).json({
        message: 'Questions retrieved successfully',
        data: formattedQuestions
      });
    } catch (error) {
      console.error('Error fetching questions:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  

// router.get('/get-questions', async (req, res) => {
//     try {
//       const questions = await rnd.findAll();
      
//       const formattedQuestions = questions.map(q => {
//         const options = {
//           ans1: q.ans1 !== null ? { label: q.ans1, score: q.ans1_score } : null,
//           ans2: q.ans2 !== null ? { label: q.ans2, score: q.ans2_score } : null,
//           ans3: q.ans3 !== null ? { label: q.ans3, score: q.ans3_score } : null,
//           ans4: q.ans4 !== null ? { label: q.ans4, score: q.ans4_score } : null,
//           ans5: q.ans5 !== null ? { label: q.ans5, score: q.ans5_score } : null,
//           ans6: q.ans6 !== null ? { label: q.ans6, score: q.ans6_score } : null,
//           ans7: q.ans7 !== null ? { label: q.ans7, score: q.ans7_score } : null,
//           ans8: q.ans8 !== null ? { label: q.ans8, score: q.ans8_score } : null,
//           ans9: q.ans9 !== null ? { label: q.ans9, score: q.ans9_score } : null,
//           ans10: q.ans10 !== null ? { label: q.ans10, score: q.ans10_score } : null
//         };
  
//         // Filter out fields with null values
//         const filteredOptions = Object.fromEntries(
//           Object.entries(options).filter(([key, value]) => value !== null)
//         );
        
//         return {
//           id: q.id,
//           type: q.type,
//           question: q.question,
//           options: filteredOptions
//         };
//       });
  
//       return res.status(200).json({
//         message: 'Questions retrieved successfully',
//         data: formattedQuestions
//       });
//     } catch (error) {
//       console.error('Error fetching questions:', error);
//       return res.status(500).json({ message: 'Internal Server Error' });
//     }
//   });
  

  router.get('/get-question/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const question = await rnd.findOne({ where: { id } });
  
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
  
      const formattedQuestion = {
        id: question.id,
        question: question.question,
        options: {
          ans1: { label: question.ans1, score: question.ans1_score },
          ans2: { label: question.ans2, score: question.ans2_score },
          ans3: { label: question.ans3, score: question.ans3_score },
          ans4: { label: question.ans4, score: question.ans4_score },
          ans5: { label: question.ans5, score: question.ans5_score },
          ans6: { label: question.ans6, score: question.ans6_score },
          ans7: { label: question.ans7, score: question.ans7_score },
          ans8: { label: question.ans8, score: question.ans8_score },
          ans9: { label: question.ans9, score: question.ans9_score },
          ans10: { label: question.ans10, score: question.ans10_score }
        }
      };
  
      return res.status(200).json({
        message: 'Question retrieved successfully',
        data: formattedQuestion
      });
    } catch (error) {
      console.error('Error fetching question:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  router.put('/update-question/:id', async (req, res) => {
    const { id } = req.params; // Get the question ID from the request parameters
    const {
      type,
      question,
      ans1,
      ans2,
      ans3,
      ans4,
      ans5,
      ans6,
      ans7,
      ans8,
      ans9,
      ans10,
      ans1_score,
      ans2_score,
      ans3_score,
      ans4_score,
      ans5_score,
      ans6_score,
      ans7_score,
      ans8_score,
      ans9_score,
      ans10_score
    } = req.body;
  
    try {
      const existingQuestion = await rnd.findOne({ where: { id } });
  
      if (!existingQuestion) {
        return res.status(404).json({ message: 'Question not found' });
      }
      await existingQuestion.update({
        type,
        question,
        ans1,
        ans2,
        ans3,
        ans4,
        ans5,
        ans6,
        ans7,
        ans8,
        ans9,
        ans10,
        ans1_score,
        ans2_score,
        ans3_score,
        ans4_score,
        ans5_score,
        ans6_score,
        ans7_score,
        ans8_score,
        ans9_score,
        ans10_score
      });
  
      return res.status(200).json({
        message: 'Question updated successfully!',
        data: existingQuestion
      });
    } catch (error) {
      console.error('Error updating question:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  router.delete('/delete-question/:id', async (req, res) => {
    const { id } = req.params; 
  
    try {
      const existingQuestion = await rnd.findOne({ where: { id } });
  
      if (!existingQuestion) {
        return res.status(404).json({ message: 'Question not found' });
      }
  
      await existingQuestion.destroy();
  
      return res.status(200).json({
        message: 'Question deleted successfully!'
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });

router.post('/insert-response', async (req, res) => {
    try {
      const { Name, question, ans,dateOfJoining,dateOfStarting, date,category } = req.body;
      const UId = req.session.UId;
     // console.log(Name, question, ans, dateOfJoining, dateOfStarting, date,category );
      if (!UId) {
        return res.status(404).json({ message: 'UId is required' });
      }
  
      const existingResponses = await rndUserresponse.findAll({
        where: { UId, question }
      });
  
      let newCount = 1; // Default to 1 if no existing responses
  
      if (existingResponses.length > 0) {
        const maxCount = Math.max(...existingResponses.map(r => parseInt(r.count, 10)));
        newCount = maxCount + 1; // Increment the count by 1
      }
  
      const newResponse = await rndUserresponse.create({
        UId,
        Name,
        question,
        ans,
        count: newCount, 
        dateOfJoining,
        dateOfStarting,
        date,
        category
      });
  console.log(newResponse);
      return res.status(201).json({
        message: 'Response inserted successfully!',
        data: newResponse
      });
    } catch (error) {
      console.error('Error inserting response:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  router.get('/fetch-responses', async (req, res) => {
    try {
        const responses = await rndUserresponse.findAll();

        if (responses.length === 0) {
            return res.status(404).json({ message: 'No responses found.' });
        }

        return res.status(200).json({
            message: 'Responses retrieved successfully!',
            data: responses
        });
    } catch (error) {
        console.error('Error fetching responses:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/fetch-data/:UId', async (req, res) => {
    try {
        const { UId } = req.params; 

        if (!UId) {
            return res.status(400).json({ message: 'UId is required' });
        }

        const responses = await rndUserresponse.findAll({
            where: { UId } 
        });

        if (responses.length === 0) {
            return res.status(404).json({ message: 'No responses found for this UId.' });
        }

        return res.status(200).json({
            message: 'Responses retrieved successfully!',
            data: responses
        });
    } catch (error) {
        console.error('Error fetching responses:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});



  
module.exports = router;
