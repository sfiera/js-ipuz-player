(function () {
    'use strict';

    function Selection(clue, x, y, across) {
        var cells = [];

        this.origin = [x, y];
        this.offset = 0;
        this.across = across;
        this.clue = clue;

        if (clue) {
            clue.classList.add('selected');
        }

        while (document.querySelector('td[data-index="' + [x, y] + '"] .letter')) {
            cells.push(document.querySelector('td[data-index="' + [x, y] + '"]'));
            across ? x++ : y++;
        }

        cells[this.offset].classList.add('primary');
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

        this.position = function () {
            if (this.across) {
                return [this.origin[0] + this.offset, this.origin[1]];
            } else {
                return [this.origin[0], this.origin[1] + this.offset];
            }
        };

        this.remove = function () {
            if (clue) clue.classList.remove('selected');
            cells[this.offset].classList.remove('primary');
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
            cells[this.offset].querySelector('.letter').textContent = letter;
            updateDone();
            cells[this.offset].classList.remove('primary');
            this.offset = (this.offset + 1) % cells.length;
            cells[this.offset].classList.add('primary');
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
        var keys = {LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, INSERT: 45, DELETE: 46, A: 65, Z: 90},
            selection = null;

        function selectClue(clue) {
            var index = clue.dataset['index'].split(','),
                across = clue.classList.contains('across');

            if (selection !== null) {
                selection.remove();
            }

            selection = createSelection(+index[0], +index[1], across);
        }

        function createSelection(x, y, across) {
            var selector = '.clue.' + (across ? 'across' : 'down') + '[data-index="' + [x, y] + '"]';
            return new Selection(document.querySelector(selector), x, y, across);
        }

        function clearSelection() {
            selection.clear();
        }

        function solveSelection() {
            selection.solve(solution);
        }

        function swapPrimary() {
            var position = selection.position(),
                x = position[0],
                y = position[1];
            while (document.querySelector('td[data-index="' + [x, y] + '"] .letter')) {
                if (document.querySelector('.clue.' + (selection.across ? 'down' : 'across') + '[data-index="' + [x, y] + '"]')) {
                    selection.remove();
                    selection = createSelection(x, y, !selection.across);
                    return;
                }
                selection.across ? y-- : x--;
            }
        }

        function selectPrevious() {
            var clue = selection.clue.previousSibling;
            if (!clue) {
                clue = document.querySelector('.clue.' + selection.class + ':last-of-type');
            }
            selectClue(clue);
        }

        function selectNext() {
            var clue = selection.clue.nextSibling;
            if (!clue) {
                clue = document.querySelector('.clue.' + selection.class + ':first-of-type');
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
            if (event.altKey || event.ctrlKey || event.shiftKey || event.metaKey) {
                return;
            }

            event.preventDefault();
            if (event.keyCode == keys.LEFT || event.keyCode == keys.RIGHT) {
                swapPrimary();
            }
            if (event.keyCode == keys.UP) {
                selectPrevious();
            }
            if (event.keyCode == keys.DOWN) {
                selectNext();
            }
            if (event.keyCode >= keys.A && event.keyCode <= keys.Z) {
                enterLetter(String.fromCharCode(event.keyCode));
            }
            if (event.keyCode == keys.INSERT) {
                solveSelection();
            }
            if (event.keyCode == keys.DELETE) {
                clearSelection();
            }
        };
    };
})();
