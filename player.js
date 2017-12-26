(function () {
    'use strict';

    const ACROSS = 'across',
          DOWN = 'down';

    function Selection(clue, origin, cursor, direction) {
        var cells = [];

        this.origin = origin;
        if (cursor) {
            this.cursor = cursor;
        } else {
            this.cursor = origin;
        }
        this.direction = direction;
        this.clue = clue;
        this.cursorUsed = false;

        if (clue) {
            clue.classList.add('selected');
        }

        var x = origin[0], y = origin[1];
        while (document.querySelector('td[data-index="' + [x, y] + '"] .letter')) {
            cells.push(document.querySelector('td[data-index="' + [x, y] + '"]'));
            (direction === ACROSS) ? x++ : y++;
        }

        this.offset = function () {
            return (this.cursor[0] - this.origin[0]) + (this.cursor[1] - this.origin[1]);
        }

        cells[this.offset()].classList.add('primary');
        cells.forEach(function (cell) {
            cell.classList.add('secondary');
        }, this);

        function updateDone() {
            var done = cells.every(function (cell) {
                return cell.querySelector('.letter').textContent;
            });
            if (done) {
                clue.classList.add('done');
            } else {
                clue.classList.remove('done');
            }
        }

        this.remove = function () {
            if (clue) clue.classList.remove('selected');
            cells[this.offset()].classList.remove('primary');
            cells.forEach(function (cell) {
                cell.classList.remove('secondary');
            }, this);
        };

        this.clear = function () {
            cells.forEach(function (cell) {
                cell.querySelector('.letter').textContent = '';
            });
            updateDone();
        };

        this.enterLetter = function (letter) {
            this.cursorUsed = true;
            cells[this.offset()].querySelector('.letter').textContent = letter;
            updateDone();
            cells[this.offset()].classList.remove('primary');
            var newOffset = (this.offset() + 1) % cells.length;
            if (this.direction === ACROSS) {
                this.cursor = [this.origin[0] + newOffset, this.origin[1]];
            } else {
                this.cursor = [this.origin[0], this.origin[1] + newOffset];
            }
            cells[this.offset()].classList.add('primary');
        };

        this.backspace = function () {
            if (this.cursorUsed) {
                var newOffset = this.offset() - 1;
                if (newOffset < 0) {
                    return;
                }
                cells[this.offset()].classList.remove('primary');
                if (this.direction === ACROSS) {
                    this.cursor = [this.origin[0] + newOffset, this.origin[1]];
                } else {
                    this.cursor = [this.origin[0], this.origin[1] + newOffset];
                }
                cells[this.offset()].classList.add('primary');
            }
            cells[this.offset()].querySelector('.letter').textContent = '';
            this.cursorUsed = true;
        };

        this.solve = function (solution) {
            var x = this.origin[0], y = this.origin[1];
            cells.forEach(function (cell) {
                cell.querySelector('.letter').textContent = solution[y][x];
                (direction === ACROSS) ? x++ : y++;
            });
            updateDone();
        };
    }

    window.IpuzPlayer = function (ipuz) {
        var keys = {LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, RETURN: 13, TAB: 9, INSERT: 45, BACKSPACE: 8, DELETE: 46, A: 65, Z: 90},
            selection = null;

        function selectClue(clue) {
            var index = clue.dataset['index'].split(','),
                direction = clue.classList.contains('across') ? ACROSS : DOWN;

            if (selection !== null) {
                selection.remove();
            }

            selection = createSelection([+index[0], +index[1]], direction);
        }

        function selectCell(cell) {
            var index = cell.dataset['index'].split(',');
            var location = [+index[0], +index[1]];
            console.log(location, selection.cursor);
            if ((location[0] === selection.cursor[0]) && (location[1] === selection.cursor[1])) {
                swapPrimary();
            } else {
                selection.remove();
                selection = createSelection(location, selection.direction);
            }
        }

        function createSelection(cursor, direction) {
            var x = cursor[0],
                y = cursor[1],
                clue;
            while (document.querySelector('td[data-index="' + [x, y] + '"] .letter')) {
                clue = document.querySelector(
                        '.clue.' + direction + '[data-index="' + [x, y] + '"]');
                if (clue) {
                    break;
                }
                (direction === ACROSS) ? x-- : y--;
            }
            return new Selection(clue, [x, y], cursor, direction);
        }

        function clearSelection() {
            selection.clear();
        }

        function solveSelection() {
            selection.solve(ipuz.solution);
        }

        function swapPrimary() {
            var x = selection.cursor[0],
                y = selection.cursor[1];
            while (document.querySelector('td[data-index="' + [x, y] + '"] .letter')) {
                if (document.querySelector('.clue.' + selection.direction + '[data-index="' + [x, y] + '"]')) {
                    selection.remove();
                    selection = createSelection(selection.cursor, (selection.direction === ACROSS) ? DOWN : ACROSS);
                    return;
                }
                (selection.direction === ACROSS) ? x-- : y--;
            }
        }

        function moveCursor(offset) {
            var newCursor = [selection.cursor[0] + offset[0], selection.cursor[1] + offset[1]];
            while (document.querySelector('td[data-index="' + newCursor + '"]')) {
                if (document.querySelector('td[data-index="' + newCursor + '"] .letter')) {
                    selection.remove();
                    selection = createSelection(newCursor, selection.direction);
                    return;
                }
                newCursor[0] += offset[0];
                newCursor[1] += offset[1];
            }
        }

        function selectPrevious() {
            var clue = selection.clue.previousSibling;
            if (!clue) {
                clue = document.querySelector('.clue.' + selection.direction + ':last-of-type');
            }
            selectClue(clue);
        }

        function selectNext() {
            var clue = selection.clue.nextSibling;
            if (!clue) {
                clue = document.querySelector('.clue.' + selection.direction + ':first-of-type');
            }
            selectClue(clue);
        }

        function enterLetter(letter) {
            selection.enterLetter(letter);
        }

        selectClue(document.querySelector('.clue.across:first-of-type'));

        document.querySelectorAll(".clue").forEach(function(target) {
            target.addEventListener("click", function(e) {
                e.preventDefault();
                selectClue(target);
            });
        });
        document.querySelectorAll(".cell").forEach(function(target) {
            target.addEventListener("click", function(e) {
                e.preventDefault();
                selectCell(target);
            });
        });

        document.onkeydown = function (event) {
            if (event.altKey || event.ctrlKey || event.metaKey) {
                return;
            }

            event.preventDefault();
            switch (event.keyCode) {
                case keys.LEFT:
                case keys.RIGHT:
                    if (!event.shiftKey && (selection.direction === DOWN)) {
                        swapPrimary();
                    } else {
                        moveCursor([(event.keyCode == keys.LEFT) ? -1 : +1, 0]);
                    }
                    break;

                case keys.UP:
                case keys.DOWN:
                    if (!event.shiftKey && (selection.direction === ACROSS)) {
                        swapPrimary();
                    } else {
                        moveCursor([0, (event.keyCode == keys.UP) ? -1 : +1]);
                    }
                    break;

                case keys.RETURN:
                    if (event.shiftKey) {
                        selectPrevious();
                    } else {
                        selectNext();
                    }
                    break;

                case keys.TAB:
                    swapPrimary();
                    break;

                case keys.BACKSPACE:
                    selection.backspace();
                    break;

                case keys.INSERT:
                    solveSelection();
                    break;

                case keys.DELETE:
                    clearSelection();
                    break;

                default:
                    if (event.keyCode >= keys.A && event.keyCode <= keys.Z) {
                        enterLetter(String.fromCharCode(event.keyCode));
                    }
                    break;
            }
        };
    };
})();
