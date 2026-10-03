const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submissions");

const {
    getLanguageById,
    submitBatch,
    submitToken
} = require("../utils/problemUtility");


const createProblem = async (req, res) => {

    try {

        const {
            title,
            description,
            difficulty,
            tags,
            visibleTestCases,
            hiddenTestCases,
            startCode,
            referenceSolution
        } = req.body;


        // -----------------------------
        // BASIC VALIDATION
        // -----------------------------

        if (
            !title ||
            !description ||
            !difficulty ||
            !tags
        ) {
            return res.status(400).json({
                success: false,
                message: "Title, description, difficulty and tags are required"
            });
        }


        if (
            !Array.isArray(visibleTestCases) ||
            visibleTestCases.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "visibleTestCases must be a non-empty array"
            });
        }


        if (
            !Array.isArray(hiddenTestCases) ||
            hiddenTestCases.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "hiddenTestCases must be a non-empty array"
            });
        }


        if (
            !Array.isArray(startCode) ||
            startCode.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "startCode must be a non-empty array"
            });
        }


        if (
            !Array.isArray(referenceSolution) ||
            referenceSolution.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "referenceSolution must be a non-empty array"
            });
        }


        // -----------------------------
        // CHECK LANGUAGES
        // -----------------------------

        for (const solution of referenceSolution) {

            const languageId = getLanguageById(solution.language);

            if (!languageId) {

                return res.status(400).json({
                    success: false,
                    message: `Unsupported language: ${solution.language}`
                });
            }

            if (!solution.completeCode) {

                return res.status(400).json({
                    success: false,
                    message: `completeCode missing for ${solution.language}`
                });
            }
        }


        // -----------------------------
        // CREATE JUDGE0 SUBMISSIONS
        // -----------------------------

        const submissions = [];


        for (const solution of referenceSolution) {

            const languageId = getLanguageById(solution.language);

            for (const testCase of visibleTestCases) {

                submissions.push({
                    language_id: languageId,

                    source_code: solution.completeCode,

                    stdin: testCase.input,

                    expected_output: testCase.output
                });
            }
        }


        console.log("Judge0 submissions:");
        console.log(submissions);


        // -----------------------------
        // SEND TO JUDGE0
        // -----------------------------

        const submissionResult = await submitBatch(submissions);


        if (
            !submissionResult ||
            !Array.isArray(submissionResult)
        ) {

            return res.status(500).json({
                success: false,
                message: "Invalid response from Judge0"
            });
        }


        const tokens = submissionResult.map(
            (submission) => submission.token
        );


        if (
            tokens.length !== submissions.length ||
            tokens.some((token) => !token)
        ) {

            return res.status(500).json({
                success: false,
                message: "Judge0 did not return valid tokens"
            });
        }


        // -----------------------------
        // WAIT FOR RESULT
        // -----------------------------

        const results = await submitToken(tokens);


        console.log("Judge0 results:");
        console.log(results);


        // -----------------------------
        // CHECK ALL REFERENCE SOLUTIONS
        // -----------------------------

        const failedResult = results.find(
            (result) => result.status_id !== 3
        );


        if (failedResult) {

            return res.status(400).json({
                success: false,

                message: "Reference solution failed",

                result: {
                    status: failedResult.status,
                    status_id: failedResult.status_id,
                    stdout: failedResult.stdout,
                    stderr: failedResult.stderr,
                    compile_output: failedResult.compile_output,
                    message: failedResult.message
                }
            });
        }


        // -----------------------------
        // GET CREATOR
        // -----------------------------

        const problemCreator = req.result?._id || req.user?._id;


        if (!problemCreator) {

            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }


        // -----------------------------
        // SAVE PROBLEM
        // -----------------------------

        const problem = await Problem.create({

            title,

            description,

            difficulty,

            tags,

            visibleTestCases,

            hiddenTestCases,

            startCode,

            referenceSolution,

            problemCreator
        });


        return res.status(201).json({

            success: true,

            message: "Problem created successfully",

            problem

        });


    } catch (error) {

        console.error("Create Problem Error:", error);

        return res.status(500).json({

            success: false,

            message: error.message || "Internal Server Error"

        });
    }
};


const updateProblem = async (req,res)=>{
    
  const {id} = req.params;
  const {title,description,difficulty,tags,
    visibleTestCases,hiddenTestCases,startCode,
    referenceSolution, problemCreator
   } = req.body;

  try{
 
     if(!id){
      return res.status(400).send("Missing ID Field");
     }

    const DsaProblem =  await Problem.findById(id);
    if(!DsaProblem)
    {
      return res.status(404).send("ID is not persent in server");
    }
      
    for(const {language,completeCode} of referenceSolution){
         

      // source_code:
      // language_id:
      // stdin: 
      // expectedOutput:

      const languageId = getLanguageById(language);
        
      // I am creating Batch submission
      const submissions = visibleTestCases.map((testcase)=>({
          source_code:completeCode,
          language_id: languageId,
          stdin: testcase.input,
          expected_output: testcase.output
      }));


      const submitResult = await submitBatch(submissions);
      // console.log(submitResult);

      const resultToken = submitResult.map((value)=> value.token);

      // ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]
      
     const testResult = await submitToken(resultToken);

    //  console.log(testResult);

     for(const test of testResult){
      if(test.status_id!=3){
       return res.status(400).send("Error Occured");
      }
     }

    }


  const newProblem = await Problem.findByIdAndUpdate(id , {...req.body}, {runValidators:true, new:true});
   
  res.status(200).send(newProblem);
  }
  catch(err){
      res.status(500).send("Error: "+err);
  }
}


const deleteProblem = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

   const deletedProblem = await Problem.findByIdAndDelete(id);

   if(!deletedProblem)
    return res.status(404).send("Problem is Missing");


   res.status(200).send("Successfully Deleted");
  }
  catch(err){
     
    res.status(500).send("Error: "+err);
  }
}


const getProblemById = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

    const getProblem = await Problem.findById(id).select('_id title description difficulty tags visibleTestCases startCode referenceSolution ');
   
    // video ka jo bhi url wagera le aao

   if(!getProblem)
    return res.status(404).send("Problem is Missing");

  return res.status(200).send(getProblem);

  //  const videos = await SolutionVideo.findOne({problemId:id});

  //  if(videos){   
    
  //  const responseData = {
  //   ...getProblem.toObject(),
  //   secureUrl:videos.secureUrl,
  //   thumbnailUrl : videos.thumbnailUrl,
  //   duration : videos.duration,
  //  } 
  
   
  //  }
    
   res.status(200).send(getProblem);

  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}

const getAllProblem = async(req,res)=>{

  try{
     
    const getProblem = await Problem.find({}).select('_id title difficulty tags'); //-- here it is giving all problems, pagination & filteration to be add

   if(getProblem.length==0)
    return res.status(404).send("Problem is Missing");


   res.status(200).send(getProblem);
  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}

const solvedAllProblembyUser =  async(req,res)=>{
    
        try{
        
        const userId = req.user._id;

        const user =  await User.findById(userId).populate({
            path:"problemSolved",
            select:"_id title difficulty tags"
        });
        
        res.status(200).send(user.problemSolved);

        }
        catch(err){
        res.status(500).send("Server Error");
        }
    }

const submittedProblem = async(req,res)=>{

  try{
   
     
    const userId = req.user._id;
    
    const problemId = req.params.pid;
   const ans = await Submission.find({userId,problemId});


  if(ans.length==0)
    res.status(200).send("No Submission is persent");

  res.status(200).send(ans);

  }
  catch(err){
     res.status(500).send("Internal Server Error");
  }
}

module.exports = {
    createProblem,
    updateProblem,
    deleteProblem,
    getAllProblem,
    getProblemById,
    solvedAllProblembyUser,
    submittedProblem
};


