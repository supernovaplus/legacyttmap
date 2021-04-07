const domImg = document.getElementById("mapImg");
const domCanvas = document.getElementById("mapCanvas");
const ctx = domCanvas.getContext("2d");
const domDotList = document.getElementById("dotList");
const domPlayerCard = document.getElementById("playerCard");
const domSidebar = document.getElementById("sidebar");
const domSelectServer = createSidebarBlock("Select Server");
const domMapOptions = createSidebarBlock("Map Options", false);
const domSelectPlayer = createSidebarBlock("Filter Players", false);
const domSelectJob = createSidebarBlock("Filter Jobs", false);
const domToggleSidebarButton = document.getElementById("toggleSidebar");
// const playersCount = document.getElementById("playersCount");
// const errors = document.getElementById("errors");

const playersData = {};
const permanentJobsList = {};
const temporaryPlayersList = {};
const activeFilterJobsList = [];
const activeFilterPlayersList = [];
const serversList = [
    {ip: "server.tycoon.community:30120", name: "Server #1 (OneSync)"},
    {ip: "server.tycoon.community:30122", name: "Server #2"},
    {ip: "server.tycoon.community:30123", name: "Server #3"},
    {ip: "server.tycoon.community:30124", name: "Server #4"},
    {ip: "server.tycoon.community:30125", name: "Server #5 (Beta)"},
    {ip: "na.tycoon.community:30120", name: "Server #6"},
    {ip: "na.tycoon.community:30122", name: "Server #7"},
    {ip: "na.tycoon.community:30123", name: "Server #8"},
    {ip: "na.tycoon.community:30124", name: "Server #9"},
    {ip: "na.tycoon.community:30125", name: "Server #A"}
];
const mapOptions = {
    list: [
        ["Dark Map", "https://supernovaplus.github.io/ttmap/images/maps/mapdarkmobile.jpg"],
        ["Color Map", "https://supernovaplus.github.io/ttmap/images/maps/mobilemap.jpg"]
    ],
    selected: 0
}
let activeTimeout = null;
const updateTime = 6000;
let currentlySelectedServer = serversList[0];
let serverSwitchingTimeout;

//first find the zero position, then scale the image
const imageSize = { width: 2304, height: 2304 };
const map_center_x = (imageSize.width * 0.5) - 53;
const map_center_y = (imageSize.height * 0.5) + 346;
const scale = 6.05;
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

//Map Options Block
(()=>{
    //map selection
    const row1 = document.createElement("div");
    row1.className = "row";

    const firstTitle = document.createElement("p");
    firstTitle.innerText = "Select Map:";
    row1.appendChild(firstTitle);

    mapOptions.list.forEach(_map => {
        const mapSelectBtn = document.createElement("input");
        mapSelectBtn.type = "button";
        mapSelectBtn.value = _map[0];
        mapSelectBtn.onclick = () => {
            domImg.src = _map[1];
        }

        row1.appendChild(mapSelectBtn);
    })
    //==========
    //clear canvas Button
    const row2 = document.createElement("div");
    row2.className = "row";

    const secondTitle = document.createElement("p");
    secondTitle.innerText = "Clear Canvas:";
    row2.appendChild(secondTitle);

    const clearCanvasBtn = document.createElement("input");
    clearCanvasBtn.type = "button";
    clearCanvasBtn.value = "Clear";
    clearCanvasBtn.onclick = () => {
        ctx.clearRect(0, 0, domCanvas.width, domCanvas.height);
    }

    row2.appendChild(clearCanvasBtn);

    domMapOptions.appendChild(row1);
    domMapOptions.appendChild(row2);
})();

//===========================

serversList.forEach((server, index) => {
    const rowElement = document.createElement("div");
    rowElement.className = "row";

    const inputText = document.createElement("p");
    inputText.innerText = server.name;

    server.playerCount = document.createElement("p");

    if(window.location.protocol !== "https:"){
        scanPlayerCount();
        setInterval(()=>{
            scanPlayerCount();
        }, 1000*60*2);
    }

    const inputRadio = document.createElement("input");
    inputRadio.type = "radio";
    inputRadio.name = "server";
    inputRadio.onclick = () => switchServer(server);
    if(index === 0) inputRadio.checked = true;

    rowElement.appendChild(inputRadio);
    rowElement.appendChild(inputText);
    rowElement.appendChild(server.playerCount);
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
domImg.onload = ()=>{
    console.log("image loaded");
    window.scrollTo(0, domImg.width * 0.5);
    domImg.onload = null;
}
//once image loaded start the update
// domImg.addEventListener("load",()=>{
//     console.log("image loaded")
//     window.scrollTo(0, domImg.width * 0.5)
// })
//========================
// 0,0 position for scaling image
// drawLine2({color: "red"}, 
//     coordsToMap(0, -500),
//     coordsToMap(0, 500)
// )

// drawLine2({color: "red"}, 
//     coordsToMap(-500, 0),
//     coordsToMap(500, 0)
// )

update();
function update(){
    let fetchLink = "https://novaplus-api.herokuapp.com/positions/" + currentlySelectedServer.ip;
    fetch(fetchLink).then(res=>res.json()).then(res => {
        if(!res || (res && !res.data)){
            currentlySelectedServer.playerCount.innerText = "(error)";
            return;
        }
        currentlySelectedServer.playerCount.innerText = `(${res.data.players.length})`;

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

            if(player[6] && player[6].length > 1){
                for (let i = 1; i < player[6].length; i++) {
                    const _lastPos = player[6][i-1];
                    const _currentPos = player[6][i];
                    if(getDistance([_lastPos[1], _lastPos[2]], [_currentPos[1], _currentPos[2]]) < 500){
                        drawLine2(playerObject, 
                                coordsToMap(_lastPos[1], _lastPos[2]),
                                coordsToMap(_currentPos[1], _currentPos[2])
                            )
                    }
                }
            }
            
            //set new dot position
            // ctx.beginPath();
            // ctx.arc(position[0], position[1], .5, 0, 2 * Math.PI);
            // ctx.stroke(); 

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

function getDistance(position1, position2){
    return Math.abs(position1[0] - position2[0]) + Math.abs(position1[1] - position2[1]);
}

function scanPlayerCount(){
    serversList.forEach((server, index) => {
        fetch(`http://${server.ip}/status/widget/players.json`).then(res=>res.json()).then(res=>{
            server.playerCount.innerText = `(${res.players.length || "?"})`;
        }).catch(err=>{
            console.error(err);
            server.playerCount.innerText = `(offline)`;
        })
    });
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

    if(activeTimeout){
        clearTimeout(activeTimeout);
    }

    serverSwitchingTimeout = setTimeout(()=>{
        update();
        serverSwitchingTimeout = null;
    }, 2000)
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

const color_letters = '0123456789ABCDEF';
function getRandomColor() { //https://stackoverflow.com/a/1484514/9601483
    let color = '#';
    for (let i = 0; i < 6; i++) { color += color_letters[Math.floor(Math.random() * 16)]; }
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

function drawLine2(player, oldPos, newPos){
    if(!player || !newPos) return;
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(oldPos[0], oldPos[1]);
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