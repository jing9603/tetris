/**
 * @license Tetris v1.0.0 08/04/2014
 * http://www.xarg.org/project/tetris/
 *
 * Copyright (c) 2014, Robert Eisele (robert@xarg.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/

(function(window) {
    var document = window["document"];
    //checked values of pre-questions
    //for "how often do you play video games" 
    var videoGame = 0;
    // for "describe yourself as a Tetris player"
    var playerLevel = 0;
    // for "how much do you like the game Tetris"
    var divRound = document.getElementsByName("round");
    var slider = document.getElementById("slider");
    var canvas = document.getElementById("canvas");
    var preview = document.getElementById("preview");
    var divScore = document.getElementById("score");
    var divTrialScore = document.getElementById("trialscore"); //show score in trial
    var divEndScore = document.getElementById("endScore"); //show final score for summary page
    var divLines = document.getElementById("lines");
    var divTrialLines = document.getElementById("triallines"); //show cleared lines in trial
    var divCountdown = document.getElementById("countdown");
    var divTimeLeft = document.getElementById("timeLeft"); //final time left on summary page
    var divSpeed = document.getElementById("speed");
    var age = document.getElementById("age");
    var gender = document.getElementById("gender");

    var ctx = canvas.getContext("2d");
    var ptx = preview.getContext("2d");

    var timerVar = null;
    var startTime = null;
    var round = 0;
    var speed = 200;
    var speedScore = 5;
    var userId = 0;
    var score = 0;
    var clearedLines = 0;
    var gameDuration = 120;
    var tileBorder = 1 * 2; // 2
    var tilesX = 12; //21;
    var tilesY = 20; //35;
    var tileSize = 17 * 2;
    var STATUS_INIT = 0;
    var STATUS_PLAY = 1;
    var STATUS_PAUSE = 2;
    var STATUS_GAMEOVER = 3;
    var STATUS_WAIT = 4;
    var gameStatus = STATUS_INIT;
    var leftWindow = false;
    var showShadow = false;
    var showPreview = true;
    var board;
    var topY;
    var curX;
    var curY;
    var PIECE_PROBABILITY = 0;
    var PIECE_ROTATABLE = 1;
    var PIECE_COLOR = 2;
    var PIECE_SHAPE = 3;
    var currentDirection = PIECE_SHAPE;
    var nextDirection = currentDirection;
    var pixelRatio = window["devicePixelRatio"] || 1;
    var pieces = [
        [
            1.0, // probability
            1, // rotatable
            [199, 74, 197], // pink
            [0, -1, -1, 0, 0, 0, 1, 0]
        ],
        [
            1.0, // probability
            1, // rotatable
            [231, 135, 59], // orange
            [0, -1, 0, 0, 0, 1, 1, 1]
        ],
        [
            1.0, // probability
            1, // rotatable
            [118, 212, 83], // green
            [0, -1, 0, 0, -1, 0, 1, -1]
        ],
        [
            1.0, // probability
            1, // rotatable
            [230, 59, 47], // red
            [0, -1, 0, 0, -1, 0, -1, 1]
        ],
        [
            1.0, // probability
            1, // rotatable
            [105, 196, 236], // light blue
            [-1, 0, 0, 0, 1, 0, 2, 0]
        ],
        [
            1.0, // probability
            1, // rotatable
            [100, 100, 100], // grey
            [-1, -1, -1, 0, 0, 0, 1, 0]
        ],
        [
            1.0, // probability
            0, // rotatable
            [243, 248, 87], // yellow
            [0, 0, 1, 0, 1, 1, 0, 1]
        ]
    ];

    var colours = [
        [199, 74, 197], // pink
        [231, 135, 59], // orange
        [118, 212, 83], // green
        [230, 59, 47], // red
        [105, 196, 236], // light blue
        [243, 248, 87] // yellow
    ];

    var NOW;
    var startTime = new Date();
    var curPiece;
    var nextPiece;
    var loopTimeout;
    var flashTime = 350;

    /* interaction data, does not affect game */
    var minSpeed = 100;
    var maxSpeed = 500;
    var currentPieceIndex = -1;
    var nextPieceIndex = -1;
    var timeLeft = gameDuration;
    var interactionData = [];
    var trialrun = false;

    var resetSpeeds = function() {
        minSpeed = 100;
        maxSpeed = 500;
    }

    var storeInteractionEvent = function(eventtype) {
        if (eventtype === "pieceappear") {
            interactionData.push({
                event: eventtype,
                time: Date.now(),
                piece: currentPieceIndex,
                board: encodeBoard(board)
            });
        } else if (eventtype === "piecedown") {
            interactionData.push({
                event: eventtype,
                time: Date.now(),
                piece: currentPieceIndex
            });
        } else {
            interactionData.push({
                event: eventtype,
                time: Date.now()
            });
        }
        console.log(eventtype + " logged." + Date.now()); //just for test
    }

    var storeInteraction = function(eventtype, keycode) {
        interactionData.push({
            event: eventtype,
            keycode: keycode,
            time: Date.now(),
            piece: currentPieceIndex
        });
    };

    //for the age drop down
    $(function() {
        var $select = $("#age");
        for (i = 1; i <= 100; i++) {
            $select.append($('<option></option>').val(i).html(i))
        }
    });

    /* end interaction data */
    $("#start").on("click", function(event) {
        console.log("start trial event handler");
        //pass the value of video radios
        videoGame = $("input[name='videoRadios']:checked").val();
        // pass the value of player level
        playerLevel = $("input[name='playerRadios']:checked").val();
        if (videoGame === undefined || playerLevel === undefined || gender.value === "empty" || age.value === "empty")
            alert("Questionnaire incomplete.")
        else startTrial();
    });

    /**
     * start the trial mode with no count down and fixed speed
     */
    var startTrial = function() {
        $("#preexperiment").hide();
        $("#game").show();
        document.getElementById("stat").style.display = "none";
        document.getElementById("roundtitle").style.display = "none";

        trialrun = true;
        speed = 400;
        setRandomId();
        setTime(gameDuration);

        preparePieces(pieces);
        prepareBoard();

        init();
    }

    $("#endtrial").on("click", function(event) {

        if (gameStatus === STATUS_INIT) {
            return;
        }

        trialrun = false;
        console.log("start experiment event handler");
        startExperiment();
    });

    var startExperiment = function() {
        // $("#preexperiment").hide();
        $("#postexperiment").hide();
        $("#game").show();
        document.getElementById("trialstat").style.display = "none";
        document.getElementById("trialtitle").style.display = "none";
        document.getElementById("roundtitle").style.display = "block";
        document.getElementById("stat").style.display = "block";

        console.log(videoGame, playerLevel, slider.value); //test

        if (round === 0) {
            resetSpeeds();
        }

        clearRecords();
        updateRound();
        setRandomSpeed();
        setTime(gameDuration);

        preparePieces(pieces);
        prepareBoard();

        init();
    };

    var endGame = function() {
        if (trialrun) {
            startTrial();
            return;
        }

        $("#game").hide();
        divEndScore.innerHTML = score;
        divTimeLeft.innerHTML = divCountdown.innerHTML;
        $("#postexperiment").show();
    };

    var endRound = function() {
        var end = false;
        if (round === 3) end = true;
        return end;
    }

    $("#slower").on("click", function(event) {
        console.log("slower event handler");
        minSpeed = speed + 1; // i know this looks wrong, but it is right
        sendFeedback("less");
    });

    $("#faster").on("click", function(event) {
        console.log("faster event handler");
        maxSpeed = speed - 1; // i know this looks wrong, but it is right
        sendFeedback("more");
    });

    var sendFeedback = function(feedback) {
        console.log(feedback);

        var request = new XMLHttpRequest();

        request.open("POST", "http://localhost:5000/feedback", true);
        request.onload = function() {
            if (request.status >= 200 && request.status < 400 && endRound()) { //if round = 3, reload the page
                // window.location.reload(false);
                $("#game").hide();
                $("#postexperiment").hide();
                $("#ending").show();
            } else if (request.status >= 200 && request.status < 400 && !endRound()) { //if round < 3, restart the game
                console.log("start a new round"); //test
                startExperiment();
            } else {
                $("#errormsg").show();
            }
        };

        request.setRequestHeader("Content-type", "application/json");
        request.send(
            JSON.stringify({
                userid: userId, //a random generated id for each participant
                gender: gender.value,
                age: age.value,
                score: score, //new added score,
                videogame: videoGame, //checked option of video game frequency
                playerlevel: playerLevel, // checked option of play level
                slider: slider.value, // value of slider for how much they love tetris
                speed: speed,
                lines: clearedLines,
                feedback: feedback,
                interaction: interactionData,
                timeLeft: timeLeft,
                board: encodeBoard(board)
            })
        );
    };

    /**
     * clear all the records on board
     */
    var clearRecords = function() {
        clearInterval(timerVar);
        interactionData = [];
        //divSpeed.innerHTML = 0;//reset speed to 0
        divScore.innerHTML = 0; //clear the scores on screens
        divLines.innerHTML = 0; //clear the lines cleared on screens
    }

    /**
     * update the round count on board
     */
    var updateRound = function() {
        round++;
        divRound[0].innerHTML = round;
        divRound[1].innerHTML = round;
    }

    var setRandomId = function() {
        //give a random id with 6 figures
        userId = Math.round(Math.random() * 1000000);
    }

    var setRandomColour = function(p) {
        var c = colours[Math.floor(Math.random() * colours.length)];
        p[PIECE_COLOR] = "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
    };

    var setRandomSpeed = function() {
        //limit the range of speed to [100, 600]
        speed = Math.floor(Math.random() * (maxSpeed - minSpeed)) + minSpeed;
        console.log("SPEEDS:", minSpeed, maxSpeed, speed);
        // speed = 400;
    };

    var encodeBoard = function() {
        var tmp = "";
        for (var y = 0; y < tilesY; y++) {
            for (var x = 0; x < tilesX; x++) {
                if (board[y][x] === undefined) {
                    tmp = tmp.concat("o");
                } else {
                    tmp = tmp.concat("x");
                }
            }
        }
        console.log(tmp);
        return tmp;
    };

    /**
     * Generates a rotated version of the piece
     *
     * @param {Array} form the original piece
     * @returns {Array} The rotated piece
     */
    var getRotatedPiece = function(form) {
        var newForm = new Array(form.length);
        for (var i = 0; i < newForm.length; i += 2) {
            newForm[i] = -form[i + 1];
            newForm[i + 1] = form[i];
        }
        return newForm;
    };

    /**
     * Get a new weighted random piece
     *
     * @returns {Array}
     */
    var getNextPiece = function() {
        var rnd = Math.random();
        for (var i = pieces.length; i--;) {
            if (rnd < pieces[i][PIECE_PROBABILITY]) {
                nextPieceIndex = i;
                nextDirection = (PIECE_SHAPE + Math.random() * 4) | 0;
                setRandomColour(pieces[i]);
                //return pieces[i];
                return JSON.parse(JSON.stringify(pieces[i]));
            }
            rnd -= pieces[i][PIECE_PROBABILITY];
        }
        nextPieceIndex = 0;
        setRandomColour(pieces[i]);
        //return pieces[0];
        return JSON.parse(JSON.stringify(pieces[0]));
    };

    /**
     * Take the next piece
     */
    var newPiece = function() {
        curPiece = nextPiece;
        currentPieceIndex = nextPieceIndex;
        currentDirection = nextDirection;

        nextPiece = getNextPiece();

        calcInitCoord();

        updatePreview();
        storeInteractionEvent("pieceappear");
    };

    /**
     * Calculate the initial coordinate of a new piece
     */
    var calcInitCoord = function() {
        var minY = -10;

        var cur = curPiece[currentDirection];

        //direction = (PIECE_SHAPE + Math.random() * 4) | 0;

        for (var i = 0; i < cur.length; i += 2) {
            minY = Math.max(minY, cur[i + 1]);
        }
        curX = tilesX >> 1;
        curY = -minY;
    };

    /**
     * Try if a move vertical move is valid
     *
     * @param {number} newY The new Y position to try
     * @returns {boolean} Indicator if it's possible to move
     */
    var tryDown = function(newY) {
        var cur = curPiece[currentDirection];

        for (var i = 0; i < cur.length; i += 2) {
            var x = cur[i] + curX;
            var y = cur[i + 1] + newY;

            if (
                y >= tilesY ||
                (board[y] !== undefined && board[y][x] !== undefined)
            ) {
                return false;
            }
        }
        curY = newY;
        return true;
    };

    /**
     * Try if a horizontal move is valid
     *
     * @param {number} newX The new X position to try
     * @param {number} dir The direction to try
     * @returns {boolean} Indicator if it's possible to move
     */
    var tryMove = function(newX, dir) {
        var cur = curPiece[dir];

        for (var i = 0; i < cur.length; i += 2) {
            var x = cur[i] + newX;
            var y = cur[i + 1] + curY;

            if (x < 0 || x >= tilesX || (y >= 0 && board[y][x] !== undefined)) {
                return false;
            }
        }
        curX = newX;
        currentDirection = dir;
        return true;
    };

    /**
     * Integrate the current piece into the board
     */
    var integratePiece = function() {
        storeInteractionEvent("piecedown"); //mark the timestamp of can not control
        var cur = curPiece[currentDirection];

        for (var i = 0; i < cur.length; i += 2) {
            // Check for game over
            if (cur[i + 1] + curY <= 0) {
                gameOver();
                break;
            } else {
                board[cur[i + 1] + curY][cur[i] + curX] = curPiece[PIECE_COLOR];
                topY[cur[i] + curX] = Math.min(topY[cur[i] + curX], cur[i + 1] + curY);
            }
        }

        if (gameStatus === STATUS_GAMEOVER) {
            pauseLoop();
        } else {
            checkFullLines();
        }

        updateScore(speedScore);
        // test use: console.log(Date.now());
    };

    /**
     * Show the game over overlay
     */
    var gameOver = function() {
        gameStatus = STATUS_GAMEOVER;
        storeInteractionEvent("gameover");
        timeLeft = gameDuration * 1000 - (new Date() - startTime);
        clearInterval(timerVar);
        endGame();
    };

    /**
     * Ultimately remove lines from the board
     *
     * @param {Array} remove A stack of lines to be removed
     */
    var removeLines = function(remove) {
        var rp = remove.length - 1;
        var wp = remove[rp--];
        var mp = wp - 1;

        for (; mp >= 0; mp--) {
            if (rp >= 0 && remove[rp] === mp) {
                rp--;
            } else {
                board[wp--] = board[mp];
            }
        }

        while (wp >= 0) {
            board[wp--] = new Array(tilesX);
        }

        for (mp = tilesX; mp--;) {
            topY[mp] += remove.length;

            // It's not possible to simply add remove.length, because you can clear lines in arbitrary order
            while (topY[mp] < tilesY && board[topY[mp]][mp] === undefined) {
                topY[mp]++;
            }
        }

        // Calculate line scoring
        clearedLines += remove.length;
        updateScore(remove.length * 20);
    };

    /**
     * Check for full lines and drop them using removeLines()
     */
    var checkFullLines = function() {
        var flashColor = ["#fff", "#fff", "#fff"];

        var remove = [];

        for (var x, y = 0; y < tilesY; y++) {
            for (x = tilesX; x--;) {
                if (board[y][x] === undefined) {
                    break;
                }
            }

            if (x < 0) {
                remove.push(y);
            }
        }

        if (remove.length > 0) {
            if (flashTime > 0) {
                gameStatus = STATUS_WAIT;
                storeInteractionEvent("flashstart");
                pauseLoop();

                animate(
                    flashTime,
                    function(pos) {
                        var cond = (pos * 10) & 1;
                        // Simply paint a flash effect over the current tiles
                        for (var i = 0; i < remove.length; i++) {
                            for (var x = tilesX; x--;) {
                                if (cond) {
                                    drawTile(ctx, x, remove[i], flashColor);
                                } else if (board[remove[i]][x] !== undefined) {
                                    drawTile(ctx, x, remove[i], board[remove[i]][x]);
                                }
                            }
                        }
                    },
                    function() {
                        removeLines(remove);
                        storeInteractionEvent("flashover");

                        newPiece();

                        draw();
                        gameStatus = STATUS_PLAY;
                        loop();
                    },
                    flashTime / 10
                );
            } else {
                removeLines(remove);
                newPiece();

                draw();
            }
        } else {
            newPiece();
        }
    };

    /**
     * The main loop of the game
     */
    var loop = function() {
        if (!tryDown(curY + 1)) {
            integratePiece();
        }

        if (gameStatus !== STATUS_INIT)
            draw();

        if (gameStatus === STATUS_PLAY) {
            loopTimeout = window.setTimeout(loop, speed);
        }
    };

    /**
     * Pause the main loop
     */
    var pauseLoop = function() {
        window.clearTimeout(loopTimeout);
    };

    /**
     * Update the score
     *
     * @param {number} n The number of points to add to the actual score
     */
    var updateScore = function(n) {
        score += n;

        divScore.innerHTML = score;
        divLines.innerHTML = clearedLines;
        //update the score at trial
        divTrialScore.innerHTML = score;
        divTrialLines.innerHTML = clearedLines;
    };

    /**
     * Draw a single tile on the screen
     *
     * @param {CanvasRenderingContext2D} ctx The context to be used
     * @param {number} x X position on the grid
     * @param {number} y Y position on the grid
     * @param {Array} color - A RGB array
     */
    var drawTile = function(ctx, x, y, color) {
        ctx.save();

        ctx.translate(
            tileBorder + x * (tileBorder + tileSize),
            tileBorder + y * (tileBorder + tileSize)
        );

        // Draw the tile border
        ctx.fillStyle = "#000";
        ctx.fillRect(-tileBorder, -tileBorder,
            tileSize + tileBorder + tileBorder,
            tileSize + tileBorder + tileBorder
        );

        // Draw the actual tile
        ctx.fillStyle = color;
        ctx.fillRect(
            tileBorder,
            tileBorder,
            tileSize - 2 * tileBorder,
            tileSize - 2 * tileBorder
        );

        ctx.fillStyle = "rgb(0,0,0)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(tileSize * 0.8, tileSize * 0.25);
        ctx.lineTo(tileSize * 0.25, tileSize * 0.25);
        ctx.lineTo(tileSize * 0.25, tileSize * 0.8);
        ctx.stroke();

        // Draw the actual tile
        //ctx.fillStyle = color[0];
        //ctx.fillRect(tileBorder, tileBorder, tileSize - 2 * tileBorder, tileSize - 2 * tileBorder);

        ctx.restore();
    };

    /**
     * Draw a single tile in shadow color
     *
     * @param {CanvasRenderingContext2D} ctx The context to be used
     * @param {number} x X position on the grid
     * @param {number} y Y position on the grid
     */
    var drawShadow = function(ctx, x, y) {
        ctx.save();

        ctx.translate(
            tileBorder + x * (tileBorder + tileSize),
            tileBorder + y * (tileBorder + tileSize)
        );

        ctx.fillStyle = "#474747";
        ctx.fillRect(0, 0, tileSize, tileSize);

        ctx.restore();
    };

    /**
     * Draw a text on the screen
     *
     * @param text The text to be drawn
     */
    var drawTextScreen = function(text) {
        ctx.font = "34px Lemon";

        // Background layer
        ctx.fillStyle = "rgba(119,136,170,0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var size = ctx.measureText(text);

        ctx.fillStyle = "#fff";
        ctx.fillText(text, (canvas.width - size.width) / 2, canvas.height / 3);
    };

    /**
     * Initialize the game with a countdown
     */
    var init = function() {
        var cnt = 4;

        prepareBoard();
        curPiece = getNextPiece();
        currentPieceIndex = nextPieceIndex;
        currentDirection = nextDirection;
        nextPiece = getNextPiece();

        calcInitCoord();

        updatePreview();

        gameStatus = STATUS_INIT;
        score = clearedLines = 0;

        animate(
            4000,
            function() {
                cnt--;

                if (!cnt) {
                    cnt = "Go!";
                    ctx.fillStyle = "#0d0";
                } else {
                    ctx.fillStyle = "#fff";
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Set the font once
                ctx.font = "60px Lemon";

                var size = ctx.measureText(cnt);

                ctx.fillText(cnt, (canvas.width - size.width) / 2, canvas.height / 3);
            },
            function() {
                storeInteractionEvent("gamestart");
                gameStatus = STATUS_PLAY;
                storeInteractionEvent("pieceappear");
                loop();

                startTime = new Date();

                if (!trialrun) {
                    timerVar = setInterval(handleTime, 100);
                }
            },
            1000
        );
    };

    /**
     * Pause or unpause the game, according to gameStatus
     */
    var pause = function() {
        if (gameStatus === STATUS_PAUSE) {
            gameStatus = STATUS_PLAY;
            loop();
        } else if (gameStatus === STATUS_PLAY) {
            gameStatus = STATUS_PAUSE;
            pauseLoop();
        }
        draw();
    };

    /**
     * Draw all components on the screen
     */
    var draw = function() {
        // http://jsperf.com/ctx-clearrect-vs-canvas-width-canvas-width/3
        // Should be fine and also the standard way to go
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var cur = curPiece[currentDirection];

        for (var y = tilesY; y--;) {
            // Draw board
            for (var x = tilesX; x--;) {
                if (board[y][x] !== undefined) {
                    drawTile(ctx, x, y, board[y][x]);
                }
            }
        }

        if (showShadow) {
            var dist = tilesY;
            for (var i = 0; i < cur.length; i += 2) {
                dist = Math.min(dist, topY[cur[i] + curX] - (curY + cur[i + 1]));
            }

            for (var i = 0; i < cur.length; i += 2) {
                drawShadow(ctx, cur[i] + curX, cur[i + 1] + curY + dist - 1);
            }
        }

        // Draw current piece
        for (var i = 0; i < cur.length; i += 2) {
            drawTile(ctx, cur[i] + curX, cur[i + 1] + curY, curPiece[PIECE_COLOR]);
        }

        // Draw text overlay
        if (gameStatus === STATUS_PAUSE) {
            drawTextScreen("PAUSE");
        } else if (gameStatus === STATUS_GAMEOVER) {
            drawTextScreen("GAME OVER");
        }
    };

    /**
     * Update the tiles on the preview monitor
     */
    var updatePreview = function() {
        if (!showPreview) return;

        ptx.clearRect(0, 0, preview.width, preview.height);

        var cur = nextPiece[nextDirection];

        for (var i = 0; i < cur.length; i += 2) {
            //drawTile(ptx, cur[i] + 5, cur[i + 1] + 5, nextPiece[PIECE_COLOR]);
            drawTile(ptx, cur[i] + 2.5, cur[i + 1] + 2.5, nextPiece[PIECE_COLOR]);
        }
    };

    /**
     * Prepare the board
     */
    var prepareBoard = function() {
        board = new Array(tilesY);
        for (var y = tilesY; y--;) {
            board[y] = new Array(tilesX);
        }

        topY = new Array(tilesX);
        for (var i = tilesX; i--;) {
            topY[i] = tilesY;
        }

        preview.width /* void */ = preview.height =
            tileBorder + 6 * (tileBorder + tileSize);

        preview.style.width = preview.width / 2 + "px";
        preview.style.height = preview.height / 2 + "px";

        canvas.width = tileBorder + tilesX * (tileBorder + tileSize);
        canvas.height = tileBorder + tilesY * (tileBorder + tileSize);

        canvas.style.width = canvas.width / 2 + "px";
        canvas.style.height = canvas.height / 2 + "px";
    };

    /**
     * Prepare the pieces and caches some values
     *
     * @param {Array} pieces The array of pieces
     */
    var preparePieces = function(pieces) {
        var sum = 0;
        var opacity = 0.2;

        for (var i = pieces.length; i--;) {
            // Pre-compute tile colors
            var color = pieces[i][PIECE_COLOR];

            color[0] |= 0;
            color[1] |= 0;
            color[2] |= 0;

            pieces[i][PIECE_COLOR] = [
                // Normal color
                "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")",
                // Dark color
                "rgb(" +
                Math.round(color[0] - color[0] * opacity) +
                "," +
                Math.round(color[1] - color[1] * opacity) +
                "," +
                Math.round(color[2] - color[2] * opacity) +
                ")",
                // Light color
                "rgb(" +
                Math.round(color[0] + (255 - color[0]) * opacity) +
                "," +
                Math.round(color[1] + (255 - color[1]) * opacity) +
                "," +
                Math.round(color[2] + (255 - color[2]) * opacity) +
                ")"
            ];

            // Add rotations
            for (var j = PIECE_SHAPE; j < 4 - 1 + PIECE_SHAPE; j++) {
                if (pieces[i][PIECE_ROTATABLE])
                    pieces[i][j + 1] = getRotatedPiece(pieces[i][j]);
                else pieces[i][j + 1] = pieces[i][PIECE_SHAPE].slice(0);
            }

            // Calculate weight sum
            sum += pieces[i][PIECE_PROBABILITY];
        }

        // Adjust the weights
        for (var i = pieces.length; i--;) {
            pieces[i][PIECE_PROBABILITY] /= sum;
        }
    };

    /**
     * A simple animation loop
     *
     * @param {number} duration The animation duration in ms
     * @param {Function} fn The callback for every animation step
     * @param {Function=} done The finish callback
     * @param {number=} speed The speed of the animation
     */
    var animate = function(duration, fn, done, speed) {
        var start = NOW();
        var loop;

        // We could use the requestAni shim, but yea...it's just fine
        (loop = function() {
            var now = NOW();

            var pct = (now - start) / duration;
            if (pct > 1) pct = 1;

            fn(pct);

            if (pct === 1) {
                done();
            } else {
                window.setTimeout(loop, speed || /* 1000 / 60*/ 16);
            }
        })();
    };

    /**
     * Attach a new event listener
     *
     * @param {Object} obj DOM node
     * @param {string} type The event type
     * @param {Function} fn The Callback
     */
    var addEvent = function(obj, type, fn) {
        if (obj.addEventListener) {
            return obj.addEventListener(type, fn, false);
        } else if (obj.attachEvent) {
            return obj.attachEvent("on" + type, fn);
        }
    };

    var setTime = function(s) {
        divCountdown.innerHTML =
            Math.floor(s / 60) + ":" + ("" + Math.floor(s % 60)).padStart(2, "0");
    };

    var handleTime = function() {
        var d = new Date();
        var s = gameDuration - (d - startTime) / 1000;

        setTime(s);
        //divSpeed.innerHTML = speed;

        if ((s < 0) && (gameStatus !== STATUS_GAMEOVER)) {
            //new added: changed 'done' to finished'
            divCountdown.innerHTML = "Finished!";
            gameOver();
        }
    };

    // Set keydown event listener
    addEvent(window, "keydown", function(ev) {
        if (gameStatus !== STATUS_PLAY && ev.keyCode !== 80 && ev.keyCode !== 9)
            return;

        storeInteraction("keydown", ev.keyCode);

        switch (ev.keyCode) {
            case 37: // left
                tryMove(curX - 1, currentDirection);
                draw();
                break;
            case 39: // right
                tryMove(curX + 1, currentDirection);
                draw();
                break;
            case 38: // up
                tryMove(curX, PIECE_SHAPE + ((currentDirection - PIECE_SHAPE + 1) % 4));
                draw();
                break;
            case 40: // down
                if (!tryDown(curY + 1)) integratePiece();
                draw();
                break;
            case 32: // space
                while (tryDown(curY + 1)) {}
                integratePiece();
                draw();
                break;
            case 80: // p
                pause();
                break;
            case 83: // s
                showShadow = !showShadow;
                return;
            case 9:
                // fall to preventDefault, as we forbid tab selection (we have hidden input fields. chrome scrolls to them)
                break;
            default:
                return;
        }
        ev.preventDefault();
    });

    addEvent(window, "keyup", function(ev) {
        if (gameStatus !== STATUS_PLAY && ev.keyCode !== 80 && ev.keyCode !== 9)
            return;
        storeInteraction("keyup", ev.keyCode);
    });

    // Set window leave listener
    addEvent(window, "blur", function() {
        if (gameStatus !== STATUS_PLAY) return;

        gameStatus = STATUS_PAUSE;

        leftWindow = true;

        pauseLoop();

        draw();
    });

    // Set comeback listener
    addEvent(window, "focus", function() {
        if (!leftWindow || gameStatus !== STATUS_PAUSE) {
            return;
        }

        gameStatus = STATUS_PLAY;

        leftWindow = false;

        loop();
    });

    if (
        window["performance"] !== undefined &&
        window["performance"]["now"] !== undefined
    ) {
        NOW = function() {
            return window.performance.now();
        };
    } else if (Date.now !== undefined) {
        NOW = Date.now;
    } else {
        NOW = function() {
            return new Date().valueOf();
        };
    }

    // Prepare the pieces and pre-calculate some caches
    //preparePieces(pieces);

    // Prepare the board
    //prepareBoard();

    // Initialize the game
    //init();
})(this);