const domImg = document.getElementById("mapImg");
const domCanvas = document.getElementById("mapCanvas");
const ctx = domCanvas.getContext("2d");
const domDotList = document.getElementById("dotList");
const domPlayerCard = document.getElementById("playerCard");
const domSidebar = document.getElementById("sidebar");
const domSelectServer = createSidebarBlock("Select Server");
const domSelectPlayer = createSidebarBlock("Filter Players", false);
const domSelectJob = createSidebarBlock("Filter Jobs", false);
const domToggleSidebarButton = document.getElementById("toggleSidebar");
// const playersCount = document.getElementById("playersCount");
// const errors = document.getElementById("errors");

const scale = 6.8;
const playersData = {};
const permanentJobsList = {};
const temporaryPlayersList = {};
const activeFilterJobsList = [];
const activeFilterPlayersList = [];
const serversList = [
    ["server.tycoon.community:30120","Server #1 (OneSync)"],
    ["server.tycoon.community:30122","Server #2"],
    ["server.tycoon.community:30123","Server #3"],
    ["server.tycoon.community:30124","Server #4"],
    ["server.tycoon.community:30125","Server #5 (Beta)"],
    ["na.tycoon.community:30120","Server #6"],
    ["na.tycoon.community:30122","Server #7"],
    ["na.tycoon.community:30123","Server #8"],
    ["na.tycoon.community:30124","Server #9"],
    ["na.tycoon.community:30125","Server #A"]
];
var activeTimeout = null;
const updateTime = 6000;
var currentlySelectedServer = serversList[0];

const imageSize = { width: 2000, height: 2000 };
const map_center_x = (imageSize.width * 0.5) - 75;
const map_center_y = (imageSize.height * 0.5) + 318;
domCanvas.width = imageSize.width;
domCanvas.height = imageSize.height;

domSidebar.style.maxHeight = window.innerHeight - 50 + "px";
window.addEventListener("resize", ()=>{
    domSidebar.style.maxHeight = window.innerHeight - 50 + "px";
});


//Toggle Options Button
(()=>{
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;

    domToggleSidebarButton.prepend(checkbox);

    toggleElementDisplay(domSidebar)
    toggleElementDisplay(domToggleSidebarButton)
    domToggleSidebarButton.onclick = () => toggleSidebar(checkbox, domSidebar);
})();
//===========================
// const debug = false;
const debug = false;
// details.style.display = "flex";

//Render Server List
// const aasf = createSidebarBlock("test");
// console.log(aasf)

serversList.forEach((server, index) => {
    const rowElement = document.createElement("div");
    rowElement.className = "row";

    const inputText = document.createElement("p");
    inputText.innerText = server[1];

    const playerCount = document.createElement("p");
    playerCount.innerText = "(?)";

    fetch(`http://${server[0]}/status/widget/players.json`).then(res=>res.json()).then(res=>{
        if(res && res.players){
            playerCount.innerText = `(${res.players.length})`;
        }
    }).catch(err=>{
        console.error(err);
        playerCount.innerText = `(offline)`;
    })

    const inputRadio = document.createElement("input");
    inputRadio.type = "radio";
    inputRadio.name = "server";
    inputRadio.onclick = () => switchServer(server);
    if(index === 0) inputRadio.checked = true;

    rowElement.appendChild(inputRadio);
    rowElement.appendChild(inputText);
    rowElement.appendChild(playerCount);
    domSelectServer.appendChild(rowElement);
});

//========================
// Player Info Card
domPlayerCard._name = document.createElement("p");
domPlayerCard._name.className = "p-head";
domPlayerCard.appendChild(domPlayerCard._name);

domPlayerCard._job = document.createElement("p");
domPlayerCard.appendChild(domPlayerCard._job);

domPlayerCard._vehicle = document.createElement("p");
domPlayerCard.appendChild(domPlayerCard._vehicle);

domPlayerCard._open = (player) => {
    domPlayerCard.hidden = false;
    domPlayerCard._name.innerText = player.name;
    domPlayerCard._job.innerHTML = "<b>Job: </b>" + player.job;
    domPlayerCard._vehicle.innerHTML = "<b>Vehicle: </b>" + player.vehicle;

    domPlayerCard._name.style.backgroundColor = player.color;
    // domPlayerCard.style.borderColor = player.color;

    domPlayerCard.style.top = (player.lastPos[1] + 10) + "px";
    domPlayerCard.style.left = player.lastPos[0] - (domPlayerCard.offsetWidth * 0.5) + "px";

    domPlayerCard._selectedPlayer = player;

    if(window.getSelection){ //text selected bug fix
        window.getSelection().removeAllRanges();
    }else if(document.selection){
        document.selection.empty();
    }
}

domPlayerCard._close = () => {
    domPlayerCard.hidden = true;
    domPlayerCard._selectedPlayer = null;
}

domPlayerCard._close();

//Close the player card when canvas is clicked
domCanvas.onclick = domPlayerCard._close;
//========================

//once image loaded start the update
domImg.addEventListener("load",()=>{
    console.log("image loaded")
    window.scrollTo(0, domImg.width * 0.5)
})
//========================

update();
function update(){
    // fetch("http://54.37.88.125:30123/status/map/positions.json")
    let fetchLink = "https://novaplus.herokuapp.com/positions/" + currentlySelectedServer[0];
    if(debug) fetchLink = "./data.json";
    fetch(fetchLink).then(res=>res.json()).then(res => {
        if(!res || (res && !res.data)){
            // errors.innerText = "Server Error"
            return;
        }
        for (let i = 0; i < res.data.players.length; i++) {
            const player = res.data.players[i];
            if(!player[3] || !player[0]) continue;
            const position = coordsToMap(player[3].x, player[3].y);
            const jobName = player[5].name || "N/A";
            let playerObject = playersData[player[2]];
            const playerName = player[0] + " #" + player[2];

            if(!temporaryPlayersList[ player[2] ]){
                temporaryPlayersList[ player[2] ] = newRowCheckbox(domSelectPlayer, playerName, filterPlayers);
            }

            if((activeFilterJobsList.length > 0 && !activeFilterJobsList.includes(jobName)) || 
                (activeFilterPlayersList.length > 0 && !activeFilterPlayersList.includes(playerName))){

                if(playerObject){
                    removePlayer(player[2]);
                }
                continue;
            }

            if(playerObject){
                const distance = Math.abs(position[0] - playerObject.lastPos[0]) + Math.abs(position[1] - playerObject.lastPos[1]);
                if(distance < 200){
                    drawLine(playerObject, position);
                }
                playerObject.lastPos = position;
                playerObject.lastUpdated = Date.now();
            }else{ // initialize new
                const dotElement = document.createElement("div")
                dotElement.className = "dot";
                playersData[player[2]] = {
                    dot: dotElement,
                    color: getRandomColor(),
                    lastPos: position,
                    name: playerName,
                    vehicle:  `${player[4].vehicle_name || "N/A"} (${player[4].vehicle_type.charAt(0).toUpperCase() + player[4].vehicle_type.slice(1)})`,
                    job: jobName,
                    lastUpdated: Date.now()
                }
                playerObject = playersData[ player[2] ];
                dotElement.onclick = () => { domPlayerCard._open(playerObject); }
                dotElement.style.backgroundColor = playerObject.color;
                domDotList.appendChild(dotElement);

                if(!permanentJobsList[jobName]) {
                    permanentJobsList[jobName] = newRowCheckbox(domSelectJob, jobName, filterJobs);
                }
            }
            //set new dot position
            playerObject.dot.style.top = (position[1] - 5) +"px";
            playerObject.dot.style.left = (position[0] - 5) + "px";
        }

        if(domPlayerCard._selectedPlayer){
            domPlayerCard._open(domPlayerCard._selectedPlayer);
        }

        playersCleanup();
        activeTimeout = setTimeout(update, updateTime);
    }).catch(err=>{
        console.log(err);
        setTimeout(()=>{
            activeTimeout = setTimeout(update, updateTime);
        }, 10000);
    })
}

function switchServer(server){
    playersCleanup(true);
    currentlySelectedServer = server;

    for(const key in temporaryPlayersList){
        temporaryPlayersList[key].parentElement.remove();
        delete temporaryPlayersList[key];
    }
    activeFilterPlayersList.length = 0;
    clearCanvas();
    update();
}

function newRowCheckbox(target, value, onchange){
    const rowElement = document.createElement("div");
    rowElement.className = "row";

    const inputRadio = document.createElement("input");
    inputRadio.type = "checkbox";
    inputRadio.value = value;
    inputRadio.onchange = onchange;

    const inputText = document.createElement("p");
    inputText.innerText = value;

    rowElement.appendChild(inputRadio);
    rowElement.appendChild(inputText);
    target.appendChild(rowElement);

    return inputRadio;
}

function playersCleanup(forceCleanup = false) {
    if(forceCleanup){
        for (const key in playersData) {
            removePlayer(key);
        }
    }else{
        const timeNow = Date.now();
        for (const key in playersData) {
            if(playersData[key].lastUpdated > (timeNow + 10000)) removePlayer(key);
        }
    }
}

function removePlayer(key){
    playersData[key].dot.remove();
    delete playersData[key];
}

function filterJobs(){
    activeFilterJobsList.length = 0;
    for(const key in permanentJobsList){
        if(permanentJobsList[key].checked){
            activeFilterJobsList.push(permanentJobsList[key].value);
        }
    }
}

function filterPlayers(){
    activeFilterPlayersList.length = 0;
    for(const key in temporaryPlayersList){
        if(temporaryPlayersList[key].checked){
            activeFilterPlayersList.push(temporaryPlayersList[key].value);
        }
    }
}

function coordsToMap(_x, _y){
    return [(_x / scale) + map_center_x, (_y / -scale) + map_center_y];
}

function getRandomColor() { //https://stackoverflow.com/a/1484514/9601483
    const color_letters = '0123456789ABCDEF';
    let color = '#';
    for (var i = 0; i < 6; i++) { color += color_letters[Math.floor(Math.random() * 16)]; }
    return color;
}

function drawLine(player, newPos){
    if(!player || !newPos) return;
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(player.lastPos[0], player.lastPos[1]);
    ctx.lineTo(newPos[0], newPos[1]);
    ctx.strokeStyle = player.color;
    ctx.stroke();
}

function createSidebarBlock(text, enabled = true){
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;

    const block = document.createElement("div");
    block.className = "sidebarBlock";

    const blockHeader = document.createElement("div");
    blockHeader.className = "head";
    blockHeader.innerText = text;

    const contentBlock = document.createElement("div");
    contentBlock.className = "bg";

    if(!enabled){
        toggleContentBlock(checkbox, contentBlock)
    }

    blockHeader.onclick = () => toggleContentBlock(checkbox, contentBlock);

    blockHeader.prepend(checkbox);
    block.appendChild(blockHeader);
    block.appendChild(contentBlock);
    domSidebar.appendChild(block);
    return contentBlock;
}

function toggleElementDisplay(element){
    element.style.display = element.style.display === "none" ? "block" : "none";
}

function toggleSidebar(checkbox, element){
    const enabled = element.style.display === "none";
    element.style.display = enabled ? "block" : "none";
    checkbox.checked = enabled;
}

function toggleContentBlock(checkbox, element){
    checkbox.checked = element.hidden;
    element.hidden = !element.hidden;
}

function clearCanvas(){
    ctx.clearRect(0, 0, domCanvas.width, domCanvas.height)
}