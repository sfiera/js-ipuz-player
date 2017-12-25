(function () {
    'use strict';

    function Selection(clue, origin, cursor, across) {
        var cells = [];

        this.origin = origin;
        if (cursor) {
            this.cursor = cursor;
        } else {
            this.cursor = origin;
        }
        this.across = across;
        this.clue = clue;
        this.cursorUsed = false;

        if (clue) {
            clue.classList.add('selected');
        }

        var x = origin[0], y = origin[1];
        while (document.querySelector('td[data-index="' + [x, y] + '"] .letter')) {
            cells.push(document.querySelector('td[data-index="' + [x, y] + '"]'));
            across ? x++ : y++;
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
            if (this.across) {
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
                if (this.across) {
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
                across ? x++ : y++;
            });
            updateDone();
        };
    }

    window.IpuzPlayer = function (solution) {
        var keys = {LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, RETURN: 13, TAB: 9, INSERT: 45, BACKSPACE: 8, DELETE: 46, A: 65, Z: 90},
            selection = null;

        function selectClue(clue) {
            var index = clue.dataset['index'].split(','),
                across = clue.classList.contains('across');

            if (selection !== null) {
                selection.remove();
            }

            selection = createSelection([+index[0], +index[1]], across);
        }

        function createSelection(cursor, across) {
            var x = cursor[0],
                y = cursor[1],
                clue;
            while (document.querySelector('td[data-index="' + [x, y] + '"] .letter')) {
                clue = document.querySelector(
                        '.clue.' + (across ? 'across' : 'down') + '[data-index="' + [x, y] + '"]');
                if (clue) {
                    break;
                }
                across ? x-- : y--;
            }
            return new Selection(clue, [x, y], cursor, across);
        }

        function clearSelection() {
            selection.clear();
        }

        function solveSelection() {
            selection.solve(solution);
        }

        function swapPrimary() {
            var x = selection.cursor[0],
                y = selection.cursor[1];
            while (document.querySelector('td[data-index="' + [x, y] + '"] .letter')) {
                if (document.querySelector('.clue.' + (selection.across ? 'down' : 'across') + '[data-index="' + [x, y] + '"]')) {
                    selection.remove();
                    selection = createSelection(selection.cursor, !selection.across);
                    return;
                }
                selection.across ? y-- : x--;
            }
        }

        function moveCursor(offset) {
            var newCursor = [selection.cursor[0] + offset[0], selection.cursor[1] + offset[1]];
            while (document.querySelector('td[data-index="' + newCursor + '"]')) {
                if (document.querySelector('td[data-index="' + newCursor + '"] .letter')) {
                    selection.remove();
                    selection = createSelection(newCursor, selection.across);
                    return;
                }
                newCursor[0] += offset[0];
                newCursor[1] += offset[1];
            }
        }

        function selectPrevious() {
            var clue = selection.clue.previousSibling;
            if (!clue) {
                clue = document.querySelector('.clue.' + (selection.across ? 'down' : 'across') + ':last-of-type');
            }
            selectClue(clue);
        }

        function selectNext() {
            var clue = selection.clue.nextSibling;
            if (!clue) {
                clue = document.querySelector('.clue.' + (selection.across ? 'down' : 'across') + ':first-of-type');
            }
            selectClue(clue);
        }

        function enterLetter(letter) {
            selection.enterLetter(letter);
        }

        selectClue(document.querySelector('.clue.across:first-of-type'));

        document.onclick = function (event) {
            if (event.target.classList.contains('clue')) {
                selectClue(event.target);
            }
        };

        document.onkeydown = function (event) {
            if (event.altKey || event.ctrlKey || event.metaKey) {
                return;
            }

            event.preventDefault();
            switch (event.keyCode) {
                case keys.LEFT:
                case keys.RIGHT:
                    if (!event.shiftKey && !selection.across) {
                        swapPrimary();
                    } else {
                        moveCursor([(event.keyCode == keys.LEFT) ? -1 : +1, 0]);
                    }
                    break;

                case keys.UP:
                case keys.DOWN:
                    if (!event.shiftKey && selection.across) {
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
