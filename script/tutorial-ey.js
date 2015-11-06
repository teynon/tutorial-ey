var com = com || {};
com.eynon = com.eynon || {};
com.eynon.tutorialEy = function (options) {
    // Inherit iterator
    com.eynon.iterator.call(this, []);
    var tutorial = this;
    this.options = {
        "lockPosition": false,
        "keepInFront": true,
        "sectionSpacer" : 15,
        "pointerControlDistance": 0.3,
        "arrowHeadSize": 10,
        "arrowHeadLength": 20,
        "maxSpacing": 50,
        "uiRefresh": 500,
        "sectionCSS" : {},
        "sectionHeaderCSS" : {},
        "sectionItemCSS" : {},
        "activeStepCSS" : {},
        "tutorialCSS": {},
        "stepsCSS": {},
        "stepItemCSS": {},
        "activeStepTitleCSS": {},
        "activeStepBodyCSS": {}
    };
    this.open = false;
    this.options = $.extend(this.options, options);
    this.position = 0;
    this.refreshInterval = null;
    this.pointerCanvas = null;
    this.sectionStart = 0;
    
    this.dom = {};

    this.initialize = function () {
        this.tutorialWindow = $("<div></div>")
        .addClass("tutorialEy")
        .css($.extend({
            "display": "none"
        }, this.options.tutorialCSS)).appendTo($("body"));
        
        this.tutorialWindow.draggable({
            "containment" : "parent",
            drag: function (event, ui) {
                tutorial.updateArrow();
            }
        });

        this.dom['LeftSection'] = $("<div></div>")
        .addClass("tutorialEySectionList")
        .css(this.options.sectionCSS).appendTo(this.tutorialWindow);

        this.dom['MainSection'] = $("<div></div>")
        .addClass("tutorialEyMainSection")
        .appendTo(this.tutorialWindow);

        this.dom['SectionHeader'] = $("<div></div>")
        .addClass("tutorialEySectionHeader")
        .css(this.options.sectionHeaderCSS).appendTo(this.dom['MainSection']);

        this.dom['MainSectionContent'] = $("<div></div>")
        .addClass("tutorialEyMainContent")
        .appendTo(this.dom['MainSection']);
        
        this.dom['ActiveSectionTitle'] = $("<div></div>")
        .addClass("tutorialEySectionTitle")
        .appendTo(this.dom['SectionHeader']);

        this.dom['Close'] = $("<div></div>")
        .addClass("tutorialEyClose")
        .on("click", function () {
            tutorial.close();
        })
        .appendTo(this.dom['SectionHeader']);

        this.dom['MiddleSection'] = $("<div></div>")
        .addClass("tutorialEyActiveStep")
        .css(this.options.activeStepCSS).appendTo(this.dom['MainSectionContent']);

        this.dom['Title'] = $("<div></div>")
        .addClass("tutorialEyActiveStepTitle")
        .css(this.options.activeStepTitleCSS).appendTo(this.dom['MiddleSection']);

        this.dom['Body'] = $("<div></div>")
        .addClass("tutorialEyActiveStepBody")
        .css(this.options.activeStepBodyCSS).appendTo(this.dom['MiddleSection']);

        this.dom['Buttons'] = $("<div></div>")
        .addClass("tutorialEyButtons")
        .appendTo(this.dom['MiddleSection']);

        this.dom['Previous'] = $("<button>Previous</button>")
        .addClass("tutorialEyPrevious")
        .appendTo(this.dom['Buttons'])
        .on("click", this.goBack);

        this.dom['Next'] = $("<button>Next</button>")
        .addClass("tutorialEyNext")
        .appendTo(this.dom['Buttons'])
        .on("click", this.goForward);

        this.dom['StepsSection'] = $("<div></div>")
        .addClass("tutorialEyStepList")
        .css(this.options.stepsCSS).appendTo(this.dom['MainSectionContent']);

        this.pointerCanvas = $("<canvas></canvas>");
        this.pointerCanvas.on("mousedown", function (event) { event.preventDefault(); });
        this.pointerCanvas.appendTo($("body"));
        this.pointerCanvas.css({ "display": "none", "pointer-events": "none" });
        this.pointerCtx = this.pointerCanvas[0].getContext("2d");
    };

    // Sections
    // Steps
    this.close = function () {
        this.deactivateStep();
        clearInterval(this.refreshInterval);
        this.tutorialWindow.hide();
        this.pointerCanvas.hide();
        this.open = false;
    }

    this.addSection = function (sectionName, steps) {
        var section = new com.eynon.tutorialSection(sectionName, steps);
        this.items.push(section);
        return section;
    }

    this.goBack = function () {
        tutorial.deactivateStep();
        if (tutorial.current().position <= 0 && tutorial.position > 0) {
            tutorial.current().setKey(0);
            tutorial.setKey(tutorial.position - 1);
            tutorial.current().setKey(tutorial.current().items.length - 1);
        }
        else if (tutorial.current().position > 0) {
            tutorial.current().setKey(tutorial.current().position - 1);
        }

        tutorial.update();
    }

    this.goForward = function () {
        tutorial.deactivateStep();

        if (tutorial.current().position + 1 < tutorial.current().items.length) {
            tutorial.current().next();
        }
        else if (tutorial.position + 1 < tutorial.items.length) {
            tutorial.next();
        }

        tutorial.update();
    }

    this.activateStep = function () {
        this.current().current().activate(this);
    }

    this.deactivateStep = function () {
        this.current().current().deactivate();
    }

    this.rebuildSections = function () {
        this.dom['LeftSection'].html("");
        var activeSection = this.current();

        this.dom['Next'].show();
        this.dom['Previous'].show();

        if (this.position <= 0 && activeSection.position <= 0) {
            // Hide previous.
            this.dom['Previous'].hide();
        }
        
        if (activeSection.position + 1 >= activeSection.items.length && this.position + 1 >= this.items.length) {
            // Hide next.
            this.dom['Next'].hide();
        }

        var windowHeight = this.tutorialWindow.height();
        var showPaging = false;
        var skip = 0;

        for (var i in this.items) {
            if (skip++ < this.sectionStart) continue;

            var item = $("<div></div>")
            .css(this.options.sectionItemCSS)
            .on("click", { index: i }, function (event) {
                if (tutorial.open) {
                    tutorial.deactivateStep();
                    tutorial.setKey(event.data.index);
                    //tutorial.current().setKey(0);
                    tutorial.update();
                }
            })
            .on("mousedown", function (event) {
                event.stopPropagation();
                event.preventDefault();
            })
            .text(this.items[i].name)
            .appendTo(this.dom['LeftSection']);

            if (this.items[i] == activeSection) {
                item.addClass("tutorialEyActive");
            }

            windowHeight -= item.outerHeight();
            if (windowHeight - (item.outerHeight() * 2) <= this.options.sectionSpacer) {
                showPaging = true;
                break;
            }
        }

        if (this.sectionStart > 0 || showPaging) {
            var sectionNav = $("<div></div>")
            .addClass("tutorialEySectionNav")
            .appendTo(this.dom['LeftSection']);

            if (this.sectionStart > 0) {
                // Add previous button.
                $("<button></button>").addClass("tutorialEyScrollUp").appendTo(sectionNav)
                .on("click", function () {
                    // Scroll down.
                    tutorial.sectionStart--;
                    if (tutorial.sectionStart < 0) {
                        tutorial.sectionStart = 0;
                    }

                    tutorial.update();
                });
            }

            if (showPaging) {
                $("<button></button>").addClass("tutorialEyScrollDown").appendTo(sectionNav)
                .on("click", function () {
                    // Scroll down.
                    tutorial.sectionStart++;
                    if (tutorial.sectionStart >= tutorial.items.length) {
                        tutorial.sectionStart = tutorial.items.length - 1;
                    }

                    tutorial.update();
                });
            }
        }
    }

    this.rebuildSteps = function () {
        var section = this.current();
        this.dom['StepsSection'].html("");
        var activeStep = section.current();
        //console.log(section.items);
        for (var i in section.items) {
            var item = $("<div></div>")
            .css(this.options.stepItemCSS)
            .on("mousedown", function (event) {
                event.stopPropagation();
                event.preventDefault();
            })
            .on("click", { index: i }, function (event) {
                if (tutorial.open) {
                    tutorial.deactivateStep();
                    tutorial.current().setKey(event.data.index);
                    tutorial.update();
                }
            })
            .text(section.items[i].title)
            .appendTo(this.dom['StepsSection']);

            if (section.items[i] == activeStep) {
                item.addClass("tutorialEyActive");
            }
        }
    }

    this.update = function() {
        this.rebuildSections();
        this.activateStep();

        // Open the first section, first step
        var section = this.current();
        this.rebuildSteps();
        var step = section.current();

        this.dom['ActiveSectionTitle'].html(section.name);

        this.dom['Title'].html(step.title);
        this.dom['Body'].html(step.content);

        this.tutorialWindow.css($.extend({
            "display": "flex",
            "visibility": "visible",
            "position": "absolute"
        }, this.options.tutorialCSS));
        
        if (this.open) {
            if (!this.options.lockPosition) {
                var winLocation = this.getWindowLocation(step.getTarget(), this.tutorialWindow);
                this.tutorialWindow.css({
                    "left": winLocation.x,
                    "top": winLocation.y
                });
            }

            this.updateArrow();
        }

        if (this.options.keepInFront)
            this.bringToFront();
    },

    this.play = function () {
        this.activateStep();
        this.open = true;

        if (this.options.uiRefresh > 0) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = setInterval(function () { tutorial.updateArrow(); }, this.options.uiRefresh);
        }

        // Open the first section, first step
        var section = this.current();
        var step = section.current();

        this.dom['ActiveSectionTitle'].html(section.name);

        this.dom['Title'].html(step.title);
        this.dom['Body'].html(step.content);

        this.tutorialWindow.css($.extend({
            "display": "flex",
            "visibility": "visible",
            "position": "absolute"
        }, this.options.tutorialCSS));
        this.rebuildSections();
        this.rebuildSteps();

        var winLocation = this.getWindowLocation(step.getTarget(), this.tutorialWindow);
        this.tutorialWindow.css({
            "left": winLocation.x,
            "top": winLocation.y
        });

        this.updateArrow();

        if (this.options.keepInFront)
            this.bringToFront();
    }

    this.bringToFront = function () {
        var zTop = 0;

        var frontIndex = this.getFrontZIndex($("body"));
        if (frontIndex != parseInt(this.tutorialWindow.css("z-index"), 0)) {
            this.tutorialWindow.css("z-index", frontIndex + 1);
            this.pointerCanvas.css("z-index", frontIndex + 1);
        }
    }

    this.getFrontZIndex = function(jElement) {
        var zIndex = 0;
        jElement.children().each(function(index) {
            var cZ = parseInt($(this).css('z-index'), 0);
            if (cZ > zIndex) zIndex = cZ;
            var cZ2 = tutorial.getFrontZIndex($(this));
            if (cZ2 > zIndex) zIndex = cZ2;
        });

        return zIndex;
    }

    this.updateArrow = function () {
        // Update arrow only.
        var result = {
            x: 0,
            y: 0,
            arrowStartX: 0,
            arrowStartY: 0,
            arrowStopX: 0,
            arrowStopY: 0
        }

        if (this.current().current().getTarget() == null || !this.current().current().getTarget().is(":visible")) {
            console.log(this.current().current().getTarget());
            // Clear the arrow, return.
            this.pointerCtx.clearRect(0, 0, this.pointerCanvas.width(), this.pointerCanvas.height());
            return result;
        }

        var bounds = this.getBounds(this.current().current().getTarget());
        var tutBounds = this.getBounds(this.tutorialWindow);

        // Draw on Left
        if (tutBounds.left - bounds.left >= bounds.right - tutBounds.right) {
            result.arrowStartX = tutBounds.left;
            result.arrowStopX = bounds.right;
        }
            // Draw on right
        else {
            result.arrowStartX = tutBounds.right;
            result.arrowStopX = bounds.left;
        }

        // Draw on Top
        if (tutBounds.top - bounds.top >= bounds.bottom - tutBounds.bottom) {
            result.arrowStartY = tutBounds.top;
            result.arrowStopY = bounds.bottom;
        }
            // Draw on Bottom
        else {
            result.arrowStartY = tutBounds.bottom;
            result.arrowStopY = bounds.top;
        }

        var ccw = false;

        this.drawArrowToPoint(result.arrowStartX, result.arrowStartY, result.arrowStopX, result.arrowStopY, ccw);

        return result;
    }

    this.getWindowLocation = function (target, tutorialWindow) {
        var result = {
            x: 0,
            y: 0,
            arrowStartX: 0,
            arrowStartY: 0,
            arrowStopX: 0,
            arrowStopY: 0
        }

        // Which area has the most space available?
        var vp = {
            width: $(window).width(),
            height: $(window).height()
        }

        var tutBounds = this.getBounds(tutorialWindow);

        if (target != null) {
            var bounds = this.getBounds(target);

            // Draw on Left
            if (bounds.left >= vp.width - bounds.right) {
                if (bounds.left > tutBounds.width + this.options.maxSpacing) {
                    result.x = bounds.left - (tutBounds.width + this.options.maxSpacing);
                    result.arrowStartX = result.x + tutBounds.width;
                    result.arrowStopX = bounds.left;
                }
                else {
                    result.x = 0;
                    result.arrowStartX = tutBounds.width;
                    result.arrowStopX = bounds.left;
                }
            }
                // Draw on right
            else {
                // Left is most available.
                // - Center tutorial between right and element's right. (Or as far right as possible without pushing the page size)
                if (vp.width - bounds.right > tutBounds.width + this.options.maxSpacing) {
                    result.x = bounds.right + this.options.maxSpacing;
                    result.arrowStartX = result.x;
                    result.arrowStopX = bounds.right;
                }
                else {
                    result.x = vp.width - tutBounds.width;
                    result.arrowStartX = result.x;
                    result.arrowStopX = bounds.right;
                }
            }

            // Draw on Top
            if (bounds.top >= vp.height - bounds.bottom) {
                if (bounds.top > tutBounds.height + this.options.maxSpacing) {
                    result.y = bounds.top - (tutBounds.height + this.options.maxSpacing);
                    result.arrowStartY = result.y + tutBounds.height;
                    result.arrowStopY = bounds.top;
                }
                else {
                    result.y = 0;
                    result.arrowStartY = tutBounds.height;
                    result.arrowStopY = bounds.top;
                }
            }
                // Draw on Bottom
            else {
                if (vp.height - bounds.bottom > tutBounds.height + this.options.maxSpacing) {
                    result.y = bounds.bottom + this.options.maxSpacing;
                    result.arrowStartY = result.y;
                    result.arrowStopY = bounds.bottom;
                }
                else {
                    result.y = vp.height - tutBounds.height;
                    result.arrowStartY = result.y;
                    result.arrowStopY = bounds.bottom;
                }
            }
        }
        else {
            // Center tutorial
            result.x = (vp.width / 2) - (tutBounds.width / 2);
            result.y = (vp.height / 2) - (tutBounds.height / 2);
        }

        return result;
    }

    this.getControlPoint = function(startX, startY, endX, endY, hv, rotateCCW) {
        // Change in X,y
        var dx = startX - endX;
        var dy = startY - endY;

        // Scale to max control distance.
        var multiplier = this.options.pointerControlDistance;// * Math.sqrt(dx * dx + dy * dy);
        dx *= multiplier;
        dy *= multiplier;

        // Counter Clockwise arrow.
        var normal = {
            x: hv.x + dy,
            y: hv.y - dx
        }

        if (!rotateCCW) {
            normal.x = hv.x - dy;
            normal.y = hv.y + dx;
        }

        return normal;
    }

    this.getCPFlexPoint = function(startX, startY, endX, endY) {
        // Middle Distance Vector
        var mv = {
            x: Math.abs((startX - endX) / 2),
            y: Math.abs((startY - endY) / 2)
        }

        // Halfway point
        var hv = {
            x: startX + mv.x,
            y: startY + mv.y
        }

        if (endX < startX)
            hv.x = endX + mv.x;

        if (endY < startY)
            hv.y = endY + mv.y;

        return hv;        
    }

    this.drawArrowToPoint = function (startX, startY, endX, endY, rotateCCW) {
        var hv = this.getCPFlexPoint(startX, startY, endX, endY);
        var cp = this.getControlPoint(startX, startY, endX, endY, hv, rotateCCW);
        //console.log(cp);
        if (cp.x < 0 || cp.y < 0 || cp.x > $(window).width() || cp.y > $(window).height()) {
            cp = this.getControlPoint(startX, startY, endX, endY, hv, !rotateCCW);
        }

        var halfWayPoint = {
            x: cp.x - (cp.x - hv.x) / 5,
            y: cp.y + (cp.y - hv.y) / 5
        }

        this.pointerCanvas.prop("width", $(window).width());
        this.pointerCanvas.prop("height", $(window).height());
        this.pointerCanvas.css({
            "display": "block",
            "position": "absolute",
            "top": 0,
            "left": 0
        });
        var ahNormals = this.getNormalInfo(endX, endY, halfWayPoint.x, halfWayPoint.y);

        var arrowHeadSizeMultiplier = this.options.arrowHeadSize / Math.sqrt(ahNormals.dx * ahNormals.dx + ahNormals.dy * ahNormals.dy);
        var arrowHeadLengthMultiplier = this.options.arrowHeadLength / Math.sqrt(ahNormals.dx * ahNormals.dx + ahNormals.dy * ahNormals.dy);
        var arrowHeadTail = {
            x: endX + ahNormals.dx * arrowHeadLengthMultiplier,
            y: endY + ahNormals.dy * arrowHeadLengthMultiplier
        }

        var a1 = {
            x: arrowHeadTail.x + ahNormals.normals[0].x * arrowHeadSizeMultiplier,
            y: arrowHeadTail.y + ahNormals.normals[0].y * arrowHeadSizeMultiplier
        };

        var a2 = {
            x: endX + ahNormals.dx * arrowHeadLengthMultiplier + ahNormals.normals[1].x * arrowHeadSizeMultiplier,
            y: endY + ahNormals.dy * arrowHeadLengthMultiplier + ahNormals.normals[1].y * arrowHeadSizeMultiplier
        };

        // Debug shows control points
        /*this.pointerCtx.lineWidth = 10;
        this.pointerCtx.strokeStyle = "#00FF00";
        this.pointerCtx.beginPath();
        this.pointerCtx.arc(hv.x, hv.y, 50, 0, 2*Math.PI);
        this.pointerCtx.stroke();
        this.pointerCtx.lineWidth = 10;
        this.pointerCtx.strokeStyle = "#0000FF";
        this.pointerCtx.beginPath();
        this.pointerCtx.arc(cp.x, cp.y, 50, 0, 2 * Math.PI);
        this.pointerCtx.stroke();
        this.pointerCtx.lineWidth = 10;
        this.pointerCtx.strokeStyle = "#FF00FF";
        this.pointerCtx.beginPath();
        this.pointerCtx.arc(arrowHeadTail.x, arrowHeadTail.y, 10, 0, 2*Math.PI);
        this.pointerCtx.stroke();*/

        this.pointerCtx.lineWidth = 4;
        this.pointerCtx.strokeStyle = "#FF0000";
        this.pointerCtx.fillStyle = "#FF0000";
        this.pointerCtx.beginPath();
        this.pointerCtx.moveTo(a1.x, a1.y);
        this.pointerCtx.lineTo(endX, endY);
        this.pointerCtx.lineTo(a2.x, a2.y);
        this.pointerCtx.closePath();
        this.pointerCtx.stroke();
        this.pointerCtx.fill();

        this.pointerCtx.lineWidth = 4;
        this.pointerCtx.strokeStyle = "#FF0000";
        this.pointerCtx.beginPath();
        this.pointerCtx.moveTo(startX, startY);
        this.pointerCtx.quadraticCurveTo(cp.x, cp.y, endX, endY);
        this.pointerCtx.stroke();
    }

    this.getNormalInfo = function (x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return { dx: dx, dy: dy, normals: [{ x: dy, y: -dx }, { x: -dy, y: dx }] };
    }

    this.distance = function (p1, p2) {
        var dx = p2.x - p1.x;
        var dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    this.getBounds = function (target) {
        var bounds = {
            top: -1,
            left: -1,
            right: -1,
            bottom: -1,
            width: -1,
            height: -1
        };
        var offset = target.offset();
        bounds.top = offset.top;
        bounds.left = offset.left;
        bounds.width = target.width();
        bounds.height = target.height();
        bounds.right = bounds.left + bounds.width;
        bounds.bottom = bounds.top + bounds.height;

        return bounds;
    }

    this.getWindowBounds = function () {
        var bounds = {
            top: $(window).scrollTop(),
            left: $(window).scrollLeft(),
            bottom: $(document).height(),
            right: $(document).width(),
            width: $(document).width(),
            height: $(document).height()
        };
        return bounds;
    }

    this.initialize();
}

com.eynon.tutorialSection = function (sectionName, steps) {
    // Inherit iterator
    com.eynon.iterator.call(this, steps);

    var section = this;

    this.name = sectionName;
    this.position = 0;

    // Add a step to this section.
    this.addStep = function (step) {
        this.items.push(step);
        return step;
    }
}

/*
AdvanceOptions:
    eventListeners : [
        {
            jQuery target : $("#example"),
            string action : "click"
        }
    ]
*/
com.eynon.tutorialStep = function (targetElement, title, content, advanceOptions) {
    var step = this;

    this.advanceOptions = advanceOptions;
    console.log(targetElement);
    this.target = (targetElement == null) ? null : targetElement;
    this.title = title;
    this.content = content;

    this.activate = function (owner) {
        if (this.advanceOptions != null) {
            if (this.advanceOptions.eventListeners) {
                if (!(this.advanceOptions.eventListeners instanceof Array)) {
                    this.advanceOptions.eventListeners = [this.advanceOptions.eventListeners];
                }

                for (var i = 0; i < this.advanceOptions.eventListeners.length; i++) {
                    var action = this.advanceOptions.eventListeners[i].action;
                    this.advanceOptions.eventListeners[i].target.on(action + ".tutorialEy", { tutorial : owner }, function (event) {
                        event.data.tutorial.goForward();
                    });
                }
            }

            if (this.advanceOptions.onStep != null && typeof this.advanceOptions.onStep === "function") {
                this.advanceOptions.onStep();
            }
        }
    }

    this.deactivate = function () {
        if (this.advanceOptions != null) {
            if (this.advanceOptions.eventListeners) {
                if (!(this.advanceOptions.eventListeners instanceof Array)) {
                    this.advanceOptions.eventListeners = [this.advanceOptions.eventListeners];
                }

                for (var i = 0; i < this.advanceOptions.eventListeners.length; i++) {
                    var action = this.advanceOptions.eventListeners[i].action;
                    this.advanceOptions.eventListeners[i].target.off(action + ".tutorialEy");
                }
            }
        }
    }

    this.getTarget = function () {
        if (this.target == null) return null;
        if (typeof this.target === "function") return this.target();
        return $(this.target);
    }
}

com.eynon.iterator = function (items) {
    this.items = items;
    this.position = 0;

    this.setKey = function (key) {
        this.position = parseInt(key);
    }

    this.each = function (callback) {
        this.rewind();

        while (this.valid()) {
            callback(this.current());
            this.next();
        }

        this.rewind();
    }

    this.current = function () {
        return this.items[this.position];
    }

    this.next = function () {
        if (this.position == this.items.length)
            return false;

        this.position++;
    }

    this.key = function () {
        return this.position;
    }

    this.rewind = function () {
        this.position = 0;
    }

    this.valid = function () {
        return (this.position >= 0 && this.position < this.items.length);
    }
}