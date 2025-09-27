
console.log("Email Writer Extension - Content Script Loaded")

function createAIButton(){
    const button = document.createElement('div');
    button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3';
    button.style.marginRight = '8px';

     // 🔵 add rounder, send-like look
    button.style.backgroundColor = '#1a73e8';   // Gmail send button blue
    button.style.color = '#fff';
    button.style.borderRadius = '24px';         // makes it pill/round
    button.style.padding = '0 24px';            // horizontal padding like Send
    button.style.fontWeight = '500';
    
    button.innerHTML = 'AI Reply';
    button.setAttribute('role','button');
    button.setAttribute('data-tooltip','Generate AI Reply');
    return button;

}
function getEmailContent(){
    const selectors = [
        '.h7',
        '.a3s.aiL',
        '.gmail_quote',
        '[role="presentation"]'
    ];
    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content){
            return content.innerText.trim();
        }
        return '';
    }
}

function findComposeToolbar(){
    const selectors = [
        '.btC',
        '.aDh',
        '[role="toolbar"]',
        '.gU.Up'
    ];
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar){
            return toolbar;
        }
        return null;
    }
}
function injectButton(){
    const existingButton = document.querySelector('.ai-reply-button');
    if(existingButton) existingButton.remove();

    const toolbar = findComposeToolbar();
    if(!toolbar) {
        console.log("Toolbar not found");
        return;
    }
    console.log("Toolbar found, creating AI button");
    const button = createAIButton();
    button.classList.add('ai-reply-button');

    button.addEventListener('click', async ()=>{
        try {
            button.innerHTML='Generating...';
            button.disabled = true;

            const emailConent = getEmailContent();
            const response = await fetch('http://localhost:8080/api/email/generate',{
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json',
                },
                body: JSON.stringify({
                    emailContent: emailConent,
                    tone: "professional"
                })
            });
            if(!response.ok){
                throw new Error('API Request Failed');
            }
            const generatedReply = await response.text();
            const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');

            if (composeBox){
                composeBox.focus();
                document.execCommand('insertText', false, generatedReply);
            } else {
                console.error('Compose box was not found');
            }

        } catch (error) {
            console.error(error);
            alert('Failed to generate reply');

        }finally{
            button.innerHTML = 'AI Reply';
            button.disabled = false;
        }
    });

    toolbar.insertBefore(button, toolbar.firstChild);

}
const observer = new MutationObserver((mutations) => {
    for(const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);
        const  hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE && 
            (node.matches('.aDh,.btc, [role="dialog"]' ) || node.querySelector('.aDh, .btC, [role="dialog"]'))
        );
        
        if(hasComposeElements){
            console.log("Compose window Detected");
            setTimeout(injectButton, 500);
        }
    }
}) ;

observer.observe(document.body,{
   childList:true,
   subtree:true
})
