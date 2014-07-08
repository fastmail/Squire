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
        div.className = 'Squire-UI';
        
        $(div).load(buildPath + 'Squire-UI.html', function() {
			$('.item').click(function() {
				var me = $(this);
				var iFrame = me.parents('.Squire-UI').next('iframe').first()[0];
				var editor = iFrame.contentWindow.editor;
				console.log(SquireUI.isBold(editor));

				editor[me.data('action')](me.data('value'));
			});
		});

        $(container).append(div);
        $(container).append(iframe);

        iframe.contentWindow.editor = new Squire(iframe.contentWindow.document);
        return iframe.contentWindow.editor;
    };

    SquireUI.isBold = function (editor) { return this.isPresent( 'B', ( />B\b/ ), editor ); };
    SquireUI.isItalic = function (editor) { return isPresent( 'I', ( />I\b/ ), editor ); };
    SquireUI.isUnderlined = function (editor) { return isPresent( 'U', ( />U\b/ ), editor); };
    SquireUI.isStriked = function (editor) { return isPresent( 'S', ( />S\b/ ), editor ); };
    SquireUI.isLink = function (editor) { return isPresent( 'A', ( />A\b/ ), editor ); };
    SquireUI.isPresent = function (format, validation, editor) {
        var path = editor.getPath();
		return validation.test(path);
    };
});