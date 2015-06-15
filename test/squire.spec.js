/*global expect, describe, afterEach, beforeEach, it */
describe('Squire RTE', function () {
    var editor;
    beforeEach(function () {
        editor = new Squire(document.getElementById('testFrame').contentDocument);
    });

    afterEach(function () {
        editor = null;
    });
});
