const axios = require("axios");

const LANGUAGE_IDS = {
    "c++": 54,
    "java": 62,
    "javascript": 63
};

const getLanguageById = (lang) => {
    if (!lang) return undefined;

    return LANGUAGE_IDS[lang.toLowerCase()];
};


const submitBatch = async (submissions) => {

    const options = {
        method: "POST",
        url: "https://judge0-ce.p.rapidapi.com/submissions/batch",

        params: {
            base64_encoded: "false"
        },

        headers: {
            "x-rapidapi-key": process.env.JUDGE0_KEY,
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
            "Content-Type": "application/json"
        },

        data: {
            submissions
        }
    };

    try {

        const response = await axios.request(options);

        return response.data;

    } catch (error) {

        console.log("Judge0 Submit Error:");
        console.log("Status:", error.response?.status);
        console.log("Data:", error.response?.data);

        throw error;
    }
};


const waiting = (timer) => {
    return new Promise((resolve) => {
        setTimeout(resolve, timer);
    });
};


const submitToken = async (resultToken) => {

    if (!Array.isArray(resultToken) || resultToken.length === 0) {
        throw new Error("No Judge0 tokens received");
    }

    const options = {
        method: "GET",

        url: "https://judge0-ce.p.rapidapi.com/submissions/batch",

        params: {
            tokens: resultToken.join(","),
            base64_encoded: "false",
            fields: "*"
        },

        headers: {
            "x-rapidapi-key": process.env.JUDGE0_KEY,
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com"
        }
    };


    const maxAttempts = 30;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {

        try {

            const response = await axios.request(options);

            const submissions = response.data?.submissions || [];

            const isResultObtained = submissions.every(
                (result) => result.status_id > 2
            );

            if (isResultObtained) {
                return submissions;
            }

            await waiting(1000);

        } catch (error) {

            console.log("Judge0 Result Error:");
            console.log("Status:", error.response?.status);
            console.log("Data:", error.response?.data);

            throw error;
        }
    }

    throw new Error("Judge0 execution timeout");
};


module.exports = {
    getLanguageById,
    submitBatch,
    submitToken
};