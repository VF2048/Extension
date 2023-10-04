let Task;
let commend;
const regHash = /(#\S+)\s+?/gm;

let conf = {};
let pageHandler;
let treeHandler;

(function () {
    'use strict';

    var checkExist = setInterval(function () {
        if (typeof Hashtags !== "undefined") {
            clearInterval(checkExist);
            setConfig();
        }
    }, 100);
})();

function setConfig() {
    conf = {
        hashLevel: {
            RITM: {
                start: startLevelRitm,
                end: endLevelRitm,
            },
            INC: {
                start: startLevelINC,
                end: endLevelINC,
            },
        },
        hashCount: {
            RITM: minHashtagCountRITM,
            INC: minHashtagCountINC,
        },
        sort: {
            RITM: sortEnableRITM,
            INC: sortEnableINC,
        },
        hashtags: Hashtags,
        disableComment: {
            RITM: disableCommentRitm,
            INC: disableCommentInc,
        },
        Answers: {
            RITM: AnswersRitm,
            INC: AnswersINC,
        },
        color: {
            RITM: colorRITM,
            INC: colorINC,
        }
    };

    pageHandler = new PageHandler();
    treeHandler = new HashtagTreeHandler(hashtagTree, addHashtagToEnd);
    main();
    inputRecheak();
}

function main() {
    ifTask();
}

function ifTask() {
    const ifReady = setInterval(function () {
        if (pageHandler.ifTask()) {
            clearInterval(ifReady);
            tasktype();
            addButtons();
        }
    }, 100)
}

function tasktype() {
    Task = pageHandler.getRequestType();
    findService();
    // setcolor(Task.color);
    checkHashtag();
    addStyle();
}

function checkHashtag() {
    commend = pageHandler.getCommentField();
    closeText = pageHandler.getCloseFieldText();
    if (Task.service) {
        const redex = new RegExp(treeHandler.getRegex(), "gm");
        let hashtagTree = redex.exec(closeText)
        if (hashtagTree === null)
            pageHandler.addOverlay();
        else
            pageHandler.removeOverlay();
    }
    let hashtagIt = closeText.match(regHash);
    if (hashtagIt == null) {
        if (Task.disableComment) {
            pageHandler.setCloseCommentStyle(null, true);
            return;
        }
        else {
            pageHandler.setCloseCommentStyle(null, false);
        }
    }
    else if (hashtagIt.length < Task.hashtagCont && Task.disableComment == "one") {
        pageHandler.setCloseCommentStyle("#ff262638", false);
    }
    else if (hashtagIt.length >= Task.hashtagCont) {
        pageHandler.setCloseCommentStyle(null, false);
    }
}

function findService() {
    const elem = pageHandler.getAllServiceFields();
    Task.service = undefined;
    for (let key in serviceList)
        if (elem.text == serviceList[key])
            Task.service = key;
}

function generateButtHash() {
    let buttons = ``;
    if (Task.hashtagsLevelStart)
        for (let i = Task.hashtagsLevelStart - 1; i < Task.hashtagsLevelEnd; i++) {
            let batton = ``;
            for (let el of conf.hashtags[i]) {
                batton += pageHandler.genButton("Hashtag", el);
            }
            buttons += pageHandler.genRow(batton);
        }
    return `
        <div  id="el1">
            ${buttons}
            ${Task.sort ? pageHandler.genRow(`<button class="Sort">Отсортировать #</button>`) : ``}
            ${generateButtAns()}
        </div>`;
}

function addButtons() {
    if (pageHandler.getHashButtons() != null)
        return;
    const closeLayout = pageHandler.getButtonslayout();
    const parent = closeLayout.parentElement;
    parent.insertAdjacentHTML("beforebegin", generateButtHash());
    if (Task.type === "Inc" && Task.service)
        parent.insertAdjacentHTML("afterend", pageHandler.generateButtType());
    buttonHandler();
}

function buttonHandler() {
    pageHandler.getElementById("el1").onclick = function (e) {
        if (e.target.tagName == "BUTTON") {
            switch (e.target.className) {
                case "Hashtag":
                    addHashtag(e.target.textContent + " ");
                    break;
                case "Sort":
                    hashSort();
                    break;
                case "Answer":
                    setText(e.target.title);
                    break;
            }
        }
    };
    if (Task.service)
        pageHandler.getElementById("el2").onclick = (e) => {
            if (e.target.tagName == "BUTTON") {
                if (e.target.className == "type-define") {
                    treeHandler.generateThree(Task);
                }
            }
        };
}

function inputRecheak() {
    const inputCheak = setInterval(function () {
        const body = pageHandler.getBody();
        if (body.length > 0) {
            clearInterval(inputCheak);
            body[0].addEventListener("mousedown", () => {
                main();
            })
            body[0].addEventListener("keydown", () => {
                main();
            })
        }
    })
}

function valideteHashtag(hashtag) {
    for (let level = 0; level < conf.hashtags.length; level++)
        for (const hash of conf.hashtags[level])
            if (hashtag === hash.name) {
                checkMaxHashtags(hash[Task.max]);
                return level;
            }
    return -1;
}

function resetMaxHashtags() {
    Task.hashtagCont = Task.defHashtagCont;
}

function checkMaxHashtags(max) {
    if (max) {
        if (Task.hashtagCont > max)
            Task.hashtagCont = max;
    }
}

function hashSort(hashtag = ``) {
    let text = pageHandler.getCloseFieldText();
    const redex = new RegExp(treeHandler.getRegex(), "gm");
    let hashtagTree = redex.exec(text);
    if (hashtagTree === null)
        hashtagTree = "";
    text = text.replace(redex, ``);
    let hashtagIt = text.match(regHash);
    if (hashtagIt)
        hashtagIt.push(hashtag);
    else
        hashtagIt = [hashtag];
    let hashArray = new Array(conf.hashtags.length + 1).fill(``);
    resetMaxHashtags();
    while (hashtagIt.length > 0) {
        const lvElem = valideteHashtag(hashtagIt[0].trim())
        if (lvElem >= 0 && Task.sort)
            hashArray[lvElem] += hashtagIt[0];
        else
            hashArray[hashArray.length - 1] += hashtagIt[0];
        text = text.replace(hashtagIt[0], ``);
        hashtagIt.shift();
    }
    let com = ``;
    for (const el of hashArray)
        com += el;
    com += text + hashtagTree;
    setText(com);
    checkHashtag();
}

function addStyle() {
    const styleElement = pageHandler.createStyle("closeStyle");
    let color = (() => {
        if (disableCommentTheme == "redLines")
            return "background-image: repeating-linear-gradient(-45deg, transparent, transparent 20px,#ff262638 20px,#ff262638 40px);"
        else if (disableCommentTheme == "gray")
            return "background-color: #f9f9f9;"
    })()
    styleElement.innerHTML = `#${Task.closeComment_el}[disabled] {
        ${color};
        cursor: not-allowed;
    }`;
    document.head.appendChild(styleElement);
}

function addHashtag(hashtag) {
    hashSort(hashtag);
    generateEvent();
    tasktype();
}

function addHashtagToEnd(text) {
    redex = new RegExp(treeHandler.getRegex(), "gm");
    let closeText = pageHandler.getCloseFieldText();
    if (redex.exec(closeText) !== null)
        closeText = closeText.replace(redex, text);
    else
        closeText += text;
    if (redex.exec(closeText) !== null)
        closeText = closeText.replace(redex, text);
    else
        closeText += text;
    pageHandler.setCloseCommentText(closeText);
    generateEvent();
    tasktype();
}

function setText(text) {
    pageHandler.setCloseCommentText(text)
    generateEvent();
    tasktype();
}

function generateEvent() {
    pageHandler.getElementById(Task.closeComment_el).focus();
}

function generateButtAns() {
    let buttons = ``;
    if (!Task.answer.length)
        return "";
    for (const el of Task.answer) {
        buttons += pageHandler.genButton("Answer", el);
    }
    return pageHandler.genRow(buttons);
}