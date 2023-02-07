var playButton;
var forwardButton;
var prevButton;
var nextButton;
var rewindButton;
var durationLabel;
var currentTimeLable;
var progressBar;
var duration = 0;
var totalTimePlayed = 0;
var ctx;
var bufferSource;
var currentSong;
var progressFrame;

const DEFAULT_SONG = 'music.mp3';
const SKIP_SIZE = 100;

window.onload = async (event) => {
    prevButton = document.querySelector('#prev');
    nextButton = document.querySelector('#next');

    //disable prev and next
    prevButton.disabled = true;
    nextButton.disabled = true;

    playButton = document.querySelector('#play');
    playButton.addEventListener('click', play);

    forwardButton = document.querySelector('#skip');
    forwardButton.addEventListener('click', forward);

    rewindButton = document.querySelector('#rewind');
    rewindButton.addEventListener('click', rewind);

    durationLabel = document.querySelector('#nowPlayingDuration');
    durationLabel.innerText = buildDurationString(duration);

    currentTimeLable = document.querySelector('#nowPlayingProgress');
    currentTimeLable.value = buildDurationString(duration);

    progressBar = document.querySelector('#progressBar');
}

const play = async (event) => {
    ctx = new AudioContext();
    bufferSource?.stop();

    currentSong = await fetchSong(DEFAULT_SONG);
    bufferSource = addBufferNode(currentSong, ctx);
    bufferSource.start(0);

    duration = currentSong.duration;
    durationLabel.innerText = buildDurationString(duration);

    updateProgress(duration);
}

const buildDurationString = (duration) => {
    let decimal = Math.ceil(duration);
    let currentTime = new Date();
    let todayCopy = new Date(currentTime);
    todayCopy.setSeconds(decimal);
    return `${pad0(todayCopy.getMinutes() - currentTime.getMinutes())}:${pad0(todayCopy.getSeconds())}`;
}

const pad0 = (value) => {
    return Math.abs(value) < 10 ? `0${Math.abs(value)}` : Math.abs(value);
}

const forward = (event) => {
    let currentTime = ctx.getOutputTimestamp().contextTime;
    totalTimePlayed = currentTime;

    bufferSource.stop();
    bufferSource = addBufferNode(currentSong, ctx);
    bufferSource.start(0, ctx.currentTime+totalTimePlayed+SKIP_SIZE);

    updateProgress();
}

const rewind = (event) => {
    let currentTime = ctx.getOutputTimestamp().contextTime;
    totalTimePlayed = currentTime - SKIP_SIZE;

    bufferSource.stop();
    bufferSource = addBufferNode(currentSong, ctx);
    bufferSource.start(0, ctx.currentTime+totalTimePlayed-SKIP_SIZE);

    updateProgress();
}

const updateProgress = () => {
    cancelAnimationFrame(progressFrame);

    // can remove currentTime
    let currentTime = ctx.currentTime + totalTimePlayed + ctx.getOutputTimestamp().contextTime;
    if (currentTime <= duration) {
        currentTimeLable.value = buildDurationString(currentTime);
        paintProgressBar(currentTime, duration);
    }
    progressFrame = requestAnimationFrame(updateProgress);
}

const paintProgressBar = (current, max) => {
    let percent = 100*current/max;
    let accentColor = getComputedStyle(document.querySelector(':root'))
    .getPropertyValue('--accent');
    progressBar.style.background = `linear-gradient(to right, ${accentColor} ${percent}%, transparent ${percent}%)`
}

const addBufferNode = (buffer, ctx) => {
    let bfs = ctx.createBufferSource();
    bfs.buffer = buffer;
    bfs.connect(ctx.destination);
    return bfs;
}

const fetchSong = async (url) => {
    return await fetch(url)
    .then(data => data.arrayBuffer())
    .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer));
}