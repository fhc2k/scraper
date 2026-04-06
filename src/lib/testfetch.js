const testUrls = [
    'https://freecaptchabypass.com/api/createTask',
    'https://freecaptchabypass.com/createTask',
    'https://api.freecaptchabypass.com/createTask',
    'http://freecaptchabypass.com/api/createTask'
];

const test = async () => {
    for (const url of testUrls) {
        try {
            console.log("Testing:", url);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientKey: "b969eeaa30b76522686e4eb327d27a1e",
                    task: { type: "ReCaptchaV2Task", websiteURL: "https://google.com" }
                })
            });
            const data = await response.json();
            console.log("SUCCESS:", url);
            console.log(data);
            return;
        } catch(err) {
            console.error("FAIL:", url, "->", err.message);
        }
    }
};
test();
