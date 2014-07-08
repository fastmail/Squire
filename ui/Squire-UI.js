if (typeof buildPath == "undefined") {
        buildPath = 'build/';
}

function buildPathConCat(value) {
    return buildPath + value;
}


$(document).ready(function () {
    SquireUI = function(options) {
        // Create instance of iFrame
        var container, editor;
        
        if (options.replace) {
            container = $(options.replace).parent();
            $(options.replace).remove();
        } else if (options.div) {
            container = $(options.div);
        } else {
            throw new Error(
                "No element was defined for the editor to inject to."
            );
        }

        var iframe = document.createElement('iframe');
        var div = document.createElement('div');

        $(div).load(buildPath + 'Squire-UI.html', function () {
            $('.item').click(function () {
                console.log($(this).parent().parent().parent());
            });
        });

        $(container).append(div);
        $(container).append(iframe);
        editor = new Squire(iframe.contentWindow.document);
        return editor;
    };

    

});