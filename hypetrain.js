// ==UserScript==
// @name        Hypetrain supporters
// @description Generates a list of hype train supporters and adds a button on the moderator overlay to copy them.
// @version     1.0.3
// @grant       none
// @match       https://www.twitch.tv/moderator/baldurwoof/
// @match       https://www.twitch.tv/moderator/baldurwoof
// @downloadURL https://raw.githubusercontent.com/mamazu/hypetrain-script/main/hypetrain.js
// @updateURL   https://raw.githubusercontent.com/mamazu/hypetrain-script/main/hypetrain.js
// ==/UserScript==

function printSummary(summary, errors) {
    let summaryText = '';
    if (errors.length !== 0) {
        summaryText += `==== ERRORS ====\n${errors.join('\n')}\n`;
    }

    const formatter = new Intl.NumberFormat('en-US');
    summaryText += "==== RESULT ====\n";
    for(const [user, support] of Object.entries(summary)) {
        summaryText += `${user}: ${formatter.format(support.bits)} bits, ${formatter.format(support.subs)} subs\n`;
    }
    return summaryText;
}

function summarize(supporters) {
    // Name of the user is the key and value is the support list.
    const summary = {};
    let errors = [];
    let started = false;
    let preHypeTrainSupport = -1;
    for (const [username, text, timeStamp] of supporters) {
        const currentEntry = summary[username] || {bits: 0, subs: 0};

        if (preHypeTrainSupport === 0) {
            console.log(timeStamp);
            break;
        }
        preHypeTrainSupport--;

        let matched = false;
        if (username.trim() === 'Hype Train') {
            if (text.trim() === 'A Hype Train just started in your channel!') {
                started = true;
                preHypeTrainSupport = 2;
            }
            continue;
        }

        const subMatch = text.match(/Gave out (\d+) Community Sub gifts?/) ||
              text.match(/Gifted a (\d+) Month Tier \d+ sub to/) ||
              text.match(/Resubscribed for (\d+) month at Tier \d+/);
        if (subMatch) {
            currentEntry.subs += Number(subMatch[1]);
            matched = true;
        }

        const bitMatch = text.match(/Cheered ([0-9,]+) Bits/);
        if (bitMatch !== null) {
            currentEntry.bits += Number(bitMatch[1].replace(',',''));
            matched = true;
        }

        if (!matched) {
            errors.push('Could not match: ' + text);
        }

        summary[username] = currentEntry;
    }

    if (!started) {
        errors.push(`No start of hypetrain found. Either a bug or too much support. Scanned ${supporters.length} messages`);
    }


    return printSummary(summary, errors)
}

function generateSupporterList() {
    const supporters = document.querySelectorAll('[aria-label="Activity Feed"]')[1].innerText.split('\n')
    .filter(x => x.indexOf('•') !== -1)
    .map(x => x.split('•'))
    .filter(x => x[2].indexOf('hour') == -1 && x[2].indexOf('days') == -1);

    alert(summarize(supporters))
}

function generateButton(className) {
    const layoutContainer = document.createElement('div');
    layoutContainer.setAttribute('class', className);

    const supporterCopyButton = document.createElement('button');
    supporterCopyButton.setAttribute('id', 'mamazubutton');
    supporterCopyButton.innerText = 'Hype Train supporters';
    supporterCopyButton.style.backgroundColor = "rgb(54, 255, 255)";
    supporterCopyButton.style.color = "black";
    supporterCopyButton.addEventListener('click', generateSupporterList);

    layoutContainer.appendChild(supporterCopyButton);

    return layoutContainer;
}

setTimeout(() => {
    console.debug("Adding 'Hypetrain support generate'-button");
    const panel = document.querySelector('[data-highlight-selector="creator-meu"]')

    //Generating the button and copying over the styles of the next element as CSS classes are generated.
    panel.after(generateButton(panel.nextSibling.getAttribute('class')));
}, 5000);
