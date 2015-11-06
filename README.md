# tutorial-ey
Tutorial tool for web applications.

Demo: http://teynon.github.io/tutorial-ey/demo.html

### com.eynon.tutorialEy (options)

This is the main tutorial object. Responsible for keeping track of the current section being displayed, drawing the arrow to the target, monitoring events, and positioning the window.

*   **options**
    *   _Type:_ object
    *   _Description:_ Options for the tutorial.

    ```
    var tutorial = new com.eynon.tutorial-ey({
        "lockPosition": false, // Lock the position of the tutorial window in between steps.
        "keepInFront": true, // Periodically check to make sure the window is still at the front
        "sectionSpacer" : 15, // Gap in between section items on the left section bar.
        "pointerControlDistance": 0.3, // The distance of the control point from the mid point of the pointer arrow. Larger = more curved arrow.
        "arrowHeadSize": 10, // Width of the arrow head
        "arrowHeadLength": 20, // Length of the arrow head.
        "maxSpacing": 50, // Distance to place the tutorial window from the target of a step if that space is available.
        "uiRefresh": 500, // Interval to refresh the UI to make sure the arrow follows any moving object.
        "sectionCSS" : {}, // Optional CSS
        "sectionHeaderCSS" : {}, // Optional CSS
        "sectionItemCSS" : {},// Optional CSS
        "activeStepCSS" : {},// Optional CSS
        "tutorialCSS": {},// Optional CSS 
        "stepsCSS": {},// Optional CSS
        "stepItemCSS": {},// Optional CSS
        "activeStepTitleCSS": {},// Optional CSS
        "activeStepBodyCSS": {}// Optional CSS
    });
    tutorial.play(); // Open the tutorial window.
    ```

#### Methods

*   **close**
    *   _Description:_ Close the tutorial window.
*   **goBack**
    *   _Description:_ Go back one step.
*   **goForward**
    *   _Description:_ Go forward one step.
*   **play**
    *   _Description:_ Open the tutorial window.
*   **bringToFront**
    *   _Description:_ Bring the tutorial window to the front.
*   **updateArrow**
    *   _Description:_ Refresh / redraw the pointer arrow.
*   **addSection(sectionName, steps)**
    *   _Description:_ add a new section with the specified steps

* * *

### com.eynon.tutorialSection (sectionName, steps)

Responsible for handling an independent section. Tracks the current active step for that section.

*   **sectionName**
    *   _Type:_ String
    *   _Description:_ Name of the tutorial section.
*   **steps**
    *   _Type:_ array <com.eynon.tutorialstep>(optional)</com.eynon.tutorialstep>
    *   _Description:_ List of steps for this section.

    ```
    new com.eynon.tutorialSection("Section name", mySteps);
    ```

#### Methods

*   **addStep(step)**
    *   _Description:_ Add the specified step (com.eynon.tutorialStep)

* * *

### com.eynon.tutorialStep (targetElement, title, content, advanceOptions)

Contains each individual step and it's linked events.

*   **targetElement**
    *   _Type:_ jQuery object. Optionally can be a function to be called when the step is activated that gets the jQuery object. NULL if no target
    *   _Description:_ The element to point the arrow towards when this section is active.
*   **Title**
    *   _Type:_ string
    *   _Description:_ The title for the step. e.g. "Step 1"
*   **Content**
    *   _Type:_ string (text or HTML)
    *   _Description:_ The body of the step that the user will read.
*   **advanceOptions**
    *   _Type:_ object
    *   _Description:_ The options that control how the step behaves with user input.
    *   _Object Details:_
        *   **onStep** _(optional)_
            *   _Type:_ callback function
            *   _Description:_ Function to be called when the step is activated. This may be used for setting up the interface for the appropriate step. Keep in mind, a user can jump to any step at any point.
        *   **eventListeners** _(optional)_
            *   _Type:_ object or array of objects
            *   _Description:_ Contains events that will trigger the current step to advance to the next step.
            *   _Object Details:_
                *   **target**
                    *   _Type:_ jQuery object
                    *   _Description:_ Object to listen to for events.
                *   **action**
                    *   _Type:_ string - (click, mouseover, etc)
                    *   _Description:_ Action to listen for on the specified target.

    ```
    new com.eynon.tutorialStep(
        $("#myButton"), // Point to #myButton
        "My Title", 
        "Do X to advance to step Y.", 
        {
            eventListeners: {
                target: $("#myButton"),
                action: "mouseover"
            },
            onStep: function () {
                $("#step1").show();
                $("#step1").text("Mouse over for step 2");
            }
        }
    );
    ```
