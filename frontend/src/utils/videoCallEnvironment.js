// Video call backend server URL
let IS_PROD = false;
const videoCallServer = IS_PROD
    ? "https://your-deployed-backend.com"
    : "http://localhost:3000";

export default videoCallServer;