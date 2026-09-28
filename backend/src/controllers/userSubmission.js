const Problem = require("../models/problem");
const Submission = require("../models/submissions");
const User = require("../models/user");
const {getLanguageById,submitBatch,submitToken} = require("../utils/problemUtility");

const submitCode = async (req,res)=>{
   
    // 
    try{
      
       const userId = req.user._id;
       const problemId = req.params.id;

       let {code,language} = req.body;

      if(!userId||!code||!problemId||!language)
        return res.status(400).send("Some field missing");
      

      if(language==='cpp')
        language='c++'
      
      console.log(language);
      
    //    Fetch the problem from database
       const problem =  await Problem.findById(problemId);
    //    testcases(Hidden)
    
    //   Kya apne submission store kar du pehle....
    const submittedResult = await Submission.create({
          userId,
          problemId,
          code,
          language,
          status:'pending',
          testCasesTotal:problem.hiddenTestCases.length
     })

    //    Judge0 code ko submit karna hai
    
    const languageId = getLanguageById(language);
   
    const submissions = problem.hiddenTestCases.map((testcase)=>({
        source_code:code,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output
    }));

    
    const submitResult = await submitBatch(submissions);
    
    const resultToken = submitResult.map((value)=> value.token);

    const testResult = await submitToken(resultToken);
    

    // submittedResult ko update karo
    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = 'accepted';
    let errorMessage = null;


    for(const test of testResult){
        if(test.status_id==3){
           testCasesPassed++;
           runtime = runtime+parseFloat(test.time)
           memory = Math.max(memory,test.memory);
        }else{
          if(test.status_id==4){
            status = 'error'
            errorMessage = test.stderr
          }
          else{
            status = 'wrong'
            errorMessage = test.stderr
          }
        }
    }


    // Store the result in Database in Submission
    submittedResult.status   = status;
    submittedResult.testCasesPassed = testCasesPassed;
    submittedResult.errorMessage = errorMessage;
    submittedResult.runtime = runtime;
    submittedResult.memory = memory;

    await submittedResult.save();
    
    // ProblemId ko insert karenge userSchema ke problemSolved mein if it is not persent there.
    
    // req.result == user Information

    if(!req.user.problemSolved.includes(problemId)){
    req.user.problemSolved.push(problemId);
    await req.user.save();
}
    const accepted = (status == 'accepted')
    res.status(201).json({
      accepted,
      totalTestCases: submittedResult.testCasesTotal,
      passedTestCases: testCasesPassed,
      runtime,
      memory
    });
       
    }
    catch(err){
      res.status(500).send("Internal Server Error "+ err);
    }
}


const runCode = async (req, res) => {

    try {

        const userId = req.user._id;
        const problemId = req.params.id;

        let { code, language } = req.body;

        if (!userId || !code || !problemId || !language) {
            return res.status(400).send("Some field missing");
        }

        // Fetch the problem from database
        const problem = await Problem.findById(problemId);

        if (!problem) {
            return res.status(404).send("Problem not found");
        }

        // Convert cpp to c++
        if (language === "cpp") {
            language = "c++";
        }

        // Get Judge0 language ID
        const languageId = getLanguageById(language);

        if (!languageId) {
            return res.status(400).send("Unsupported language");
        }

        // Check visible test cases
        if (!problem.visibleTestCases || problem.visibleTestCases.length === 0) {
            return res.status(400).send("No visible test cases found");
        }

        // Prepare submissions
        const submissions = problem.visibleTestCases.map((testcase) => ({
            source_code: code,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));

        // Submit code to Judge0
        const submitResult = await submitBatch(submissions);

        const resultToken = submitResult.map(
            (value) => value.token
        );

        // Get result from Judge0
        const testResult = await submitToken(resultToken);

        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let status = true;
        let errorMessage = null;

        // Check test cases
        for (const test of testResult) {

            if (test.status_id == 3) {

                testCasesPassed++;

                runtime += parseFloat(test.time || 0);

                memory = Math.max(
                    memory,
                    test.memory || 0
                );

            } else {

                status = false;

                errorMessage =
                    test.stderr ||
                    test.compile_output ||
                    test.message ||
                    "Wrong Answer";
            }
        }

        return res.status(201).json({
            success: status,
            testCases: testResult,
            testCasesPassed,
            totalTestCases: problem.visibleTestCases.length,
            runtime,
            memory,
            errorMessage
        });

    } catch (err) {

        console.error("Run Code Error:", err);

        return res.status(500).send(
            "Internal Server Error " + err.message
        );
    }
};  


module.exports = {submitCode,runCode};


