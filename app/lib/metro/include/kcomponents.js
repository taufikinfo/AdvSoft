function kdaterange_enable_field(e,t){
    var start = moment().subtract(29, "days");
    var end = moment();

    function cb(start, end) {
        $("#"+ e ).html(start.format("MMMM D, YYYY") + " - " + end.format("MMMM D, YYYY"));
    }

    $("#"+ e).daterangepicker({
        startDate: start,
        endDate: end,
        ranges: {
            "Today": [moment(), moment()],
            "Yesterday": [moment().subtract(1, "days"), moment().subtract(1, "days")],
            "Last 7 Days": [moment().subtract(6, "days"), moment()],
            "Last 30 Days": [moment().subtract(29, "days"), moment()],
            "This Month": [moment().startOf("month"), moment().endOf("month")],
            "Last Month": [moment().subtract(1, "month").startOf("month"), moment().subtract(1, "month").endOf("month")]
        },locale: {
            format: "DD MMM YYYY"
        }
    }, cb);

    cb(start, end);
}


function kmodal_enable_field() {0

    $("#dialog").dialog({
        autoOpen: false,
        modal: true,
        buttons: {
            "Close": function () {
                $(this).dialog("close");
            }
        },
        create: function () {
            // Add Bootstrap classes to dialog components
            $(this).closest(".ui-dialog")
                .addClass("modal-content")
                .find(".ui-dialog-titlebar")
                .addClass("modal-header")
                .find(".ui-dialog-title")
                .addClass("modal-title")
                .end()
                .find(".ui-dialog-titlebar-close")
                .addClass("btn-close")
                .html("&times;");

            $(this).closest(".ui-dialog")
                .find(".ui-dialog-content")
                .addClass("modal-body");

            $(this).closest(".ui-dialog")
                .find(".ui-dialog-buttonpane")
                .addClass("modal-footer")
                .find("button")
                .addClass("btn btn-primary");
        }
    });

    // Open the dialog on button click
    $("#openDialog").click(function() {
    $("#dialog").dialog("open");
});

}


function kstepper_enable_field(e) {

    // Stepper lement
    var element =  document.querySelector("#"+ e);

// Initialize Stepper
    var stepper = new KTStepper(element);

// Handle next step
    stepper.on("kt.stepper.next", function (stepper) {
        stepper.goNext(); // go next step
    });

// Handle previous step
    stepper.on("kt.stepper.previous", function (stepper) {
        stepper.goPrevious(); // go previous step
    });
}


function kquicksearch_enable_fieldz(e){

    // var processsZZ = function(search) {
    //     var searchTerm = search.getInput().value;
    //
    //     if (searchTerm.length < 2) {
    //         return;
    //     }
    //
    //     // Show spinner
    //     var spinner = document.querySelector("[data-kt-search-element='spinner']");
    //     spinner.classList.remove("d-none");
    //
    //     // Perform AJAX request
    //     var xhr = new XMLHttpRequest();
    //     xhr.open('GET', 'search.php?search=' + encodeURIComponent(searchTerm), true);
    //     xhr.onreadystatechange = function() {
    //         if (xhr.readyState === 4 && xhr.status === 200) {
    //             var response = JSON.parse(xhr.responseText);
    //
    //             // Hide spinner
    //             spinner.classList.add("d-none");
    //
    //             if (response.status === 'success') {
    //                 // Hide recently viewed
    //                 recentlyViewedElement.classList.add("d-none");
    //                 // Show results
    //                 resultsElement.classList.remove("d-none");
    //                 // Hide empty message
    //                 emptyElement.classList.add("d-none");
    //
    //                 // Populate results
    //                 var resultsContainer = resultsElement.querySelector('.results-container');
    //                 resultsContainer.innerHTML = '';
    //                 response.results.forEach(function(result) {
    //                     var resultItem = document.createElement('div');
    //                     resultItem.className = 'result-item';
    //                     resultItem.innerText = result.your_column; // Customize as needed
    //                     resultsContainer.appendChild(resultItem);
    //                 });
    //             } else if (response.status === 'empty') {
    //                 // Hide results
    //                 resultsElement.classList.add("d-none");
    //                 // Show empty message
    //                 emptyElement.classList.remove("d-none");
    //             } else {
    //                 console.error(response.message);
    //             }
    //
    //             // Complete search
    //             search.complete();
    //         }
    //     };
    //     xhr.send();
    // }

    var processs = function(search) {
        var timeout = setTimeout(function() {
            var number = KTUtil.getRandomInt(1, 3);

            // Hide recently viewed
            mainElement.classList.add("d-none");

            if (number === 3) {
                // Hide results
                resultsElement.classList.add("d-none");
                // Show empty message
                emptyElement.classList.remove("d-none");
            } else {
                // Show results
                resultsElement.classList.remove("d-none");
                // Hide empty message
                emptyElement.classList.add("d-none");
            }

            // Complete search
            search.complete();
        }, 1500);
    }

    var clear = function(search) {
        // Show recently viewed
        mainElement.classList.remove("d-none");
        // Hide results
        resultsElement.classList.add("d-none");
        // Hide empty message
        emptyElement.classList.add("d-none");
    }

    var handlePreferences = function() {
        // Preference show handler
        preferencesShowElement.addEventListener("click", function() {
            console.log( Math.random());
            wrapperElement.classList.add("d-none");
            preferencesElement.classList.remove("d-none");
        });

        // Preference dismiss handler
        preferencesDismissElement.addEventListener("click", function() {
            wrapperElement.classList.remove("d-none");
            preferencesElement.classList.add("d-none");
        });
    }

    var handleAdvancedOptionsForm = function() {
        // Show
        advancedOptionsFormShowElement.addEventListener("click", function() {
            wrapperElement.classList.add("d-none");
            advancedOptionsFormElement.classList.remove("d-none");
        });

        // Cancel
        advancedOptionsFormCancelElement.addEventListener("click", function() {
            wrapperElement.classList.remove("d-none");
            advancedOptionsFormElement.classList.add("d-none");
        });

        // Search
        advancedOptionsFormSearchElement.addEventListener("click", function() {

        });
    }

// Elements
    element = document.querySelector("#"+e );
    console.log(e);


    if (!element) {
        return;
    }

    wrapperElement = element.querySelector("[data-kt-search-element='wrapper']");
    formElement = element.querySelector("[data-kt-search-element='form']");
    mainElement = element.querySelector("[data-kt-search-element='main']");
    resultsElement = element.querySelector("[data-kt-search-element='results']");
    emptyElement = element.querySelector("[data-kt-search-element='empty']");

    recentlyViewedElement = element.querySelector("[data-kt-search-element='recently-viewed']");

    preferencesElement = element.querySelector("[data-kt-search-element='preferences']");
    preferencesShowElement = element.querySelector("[data-kt-search-element='preferences-show']");
    preferencesDismissElement = element.querySelector("[data-kt-search-element='preferences-dismiss']");

    advancedOptionsFormElement = element.querySelector("[data-kt-search-element='advanced-options-form']");
    advancedOptionsFormShowElement = element.querySelector("[data-kt-search-element='advanced-options-form-show']");
    advancedOptionsFormCancelElement = element.querySelector("[data-kt-search-element='advanced-options-form-cancel']");
    advancedOptionsFormSearchElement = element.querySelector("[data-kt-search-element='advanced-options-form-search']");

// Initialize search handler
    searchObject = new KTSearch(element);

// Search handler
    searchObject.on("kt.search.process", processs);

// Clear handler
    searchObject.on("kt.search.clear", clear);

// Custom handlers
    handlePreferences();
    handleAdvancedOptionsForm();

}

function kquicksearch_enable_field(e){

    var processs = function(search) {
        var timeout = setTimeout(function() {
            var number = KTUtil.getRandomInt(1, 3);

            // Hide recently viewed
            recentlyViewedElement.classList.add("d-none");

            if (number === 3) {
                // Hide results
                resultsElement.classList.add("d-none");
                // Show empty message
                emptyElement.classList.remove("d-none");
            } else {
                // Show results
                resultsElement.classList.remove("d-none");
                // Hide empty message
                emptyElement.classList.add("d-none");
            }

            // Complete search
            search.complete();
        }, 1500);
    }


    var clear = function(search) {
        // Show recently viewed
        mainElement.classList.remove("d-none");
        // Hide results
        resultsElement.classList.add("d-none");
        // Hide empty message
        emptyElement.classList.add("d-none");
    }

    var handlePreferences = function() {
        // Preference show handler
        preferencesShowElement.addEventListener("click", function() {
            console.log( "preferences",Math.random());
            wrapperElement.classList.add("d-none");
            preferencesElement.classList.remove("d-none");
            advancedOptionsFormElement.classList.add("d-none");
        });

        // Preference dismiss handler
        preferencesDismissElement.addEventListener("click", function() {
            wrapperElement.classList.remove("d-none");
            preferencesElement.classList.add("d-none");
        });
    }

    var handleAdvancedOptionsForm = function() {
        // Show
        advancedOptionsFormShowElement.addEventListener("click", function() {
            console.log( "advancedOptions",Math.random());
            wrapperElement.classList.add("d-none");
            advancedOptionsFormElement.classList.remove("d-none");
            preferencesElement.classList.add("d-none")
        });

        // Cancel
        advancedOptionsFormCancelElement.addEventListener("click", function() {
            wrapperElement.classList.remove("d-none");
            advancedOptionsFormElement.classList.add("d-none");
        });

        // Search
        advancedOptionsFormSearchElement.addEventListener("click", function() {

        });
    }

// Elements
    element = document.querySelector("#"+e );

    if (!element) {
        return;
    }

    wrapperElement = element.querySelector("[data-kt-search-element='wrapper']");
    formElement = element.querySelector("[data-kt-search-element='form']");
    mainElement = element.querySelector("[data-kt-search-element='main']");
    resultsElement = element.querySelector("[data-kt-search-element='results']");
    emptyElement = element.querySelector("[data-kt-search-element='empty']");

    recentlyViewedElement = element.querySelector("[data-kt-search-element='recently-viewed']");
    
    preferencesElement = element.querySelector("[data-kt-search-element='preferences']");
    preferencesShowElement = element.querySelector("[data-kt-search-element='preferences-show']");
    preferencesDismissElement = element.querySelector("[data-kt-search-element='preferences-dismiss']");

    advancedOptionsFormElement = element.querySelector("[data-kt-search-element='advanced-options-form']");
    advancedOptionsFormShowElement = element.querySelector("[data-kt-search-element='advanced-options-form-show']");
    advancedOptionsFormCancelElement = element.querySelector("[data-kt-search-element='advanced-options-form-cancel']");
    advancedOptionsFormSearchElement = element.querySelector("[data-kt-search-element='advanced-options-form-search']");

// Initialize search handler
    searchObject = new KTSearch(element);

// Search handler
    searchObject.on("kt.search.process", processs);

// Clear handler
    searchObject.on("kt.search.clear", clear);

// Custom handlers
    handlePreferences();
    handleAdvancedOptionsForm();



}


class StylishIframeVideoPlayer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error("Container not found!");
            return;
        }

        // Find the iframe inside the container
        this.iframe = this.container.querySelector("iframe");
        if (!this.iframe) {
            console.error("No iframe found inside the container!");
            return;
        }

        this.options = options;

        // Ensure iframe has a valid video source
        const src = this.iframe.src;
        if (!src.endsWith(".mp4")) {
            console.error("Iframe must contain an MP4 video source!");
            return;
        }

        // Inject the custom toolbar
        this.initToolbar();
    }

    initToolbar() {
        // Add a container for toolbar
        const toolbar = document.createElement("div");
        toolbar.style.display = "flex";
        toolbar.style.justifyContent = "center";
        toolbar.style.gap = "10px";
        toolbar.style.marginTop = "10px";

        // Toolbar Buttons
        const playButton = this.createButton("▶️", "Play", () => this.playVideo());
        const pauseButton = this.createButton("⏸️", "Pause", () => this.pauseVideo());
        const replayButton = this.createButton("🔁", "Replay", () => this.replayVideo());

        // Append buttons to toolbar
        toolbar.appendChild(playButton);
        toolbar.appendChild(pauseButton);
        toolbar.appendChild(replayButton);

        // Add toolbar to the container
        this.container.appendChild(toolbar);
    }

    createButton(icon, tooltip, action) {
        const button = document.createElement("button");
        button.innerHTML = icon;
        button.style.padding = "10px 15px";
        button.style.fontSize = "16px";
        button.style.border = "none";
        button.style.borderRadius = "4px";
        button.style.cursor = "pointer";
        button.style.backgroundColor = "#007BFF";
        button.style.color = "#fff";
        button.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
        button.style.transition = "background-color 0.3s ease";

        button.title = tooltip;

        button.addEventListener("mouseover", () => {
            button.style.backgroundColor = "#0056b3";
        });

        button.addEventListener("mouseout", () => {
            button.style.backgroundColor = "#007BFF";
        });

        button.addEventListener("click", action);

        return button;
    }

    // Video control functions
    playVideo() {
        this.iframe.contentWindow.postMessage({ action: "play" }, "*");
    }

    pauseVideo() {
        this.iframe.contentWindow.postMessage({ action: "pause" }, "*");
    }

    replayVideo() {
        this.iframe.contentWindow.postMessage({ action: "replay" }, "*");
    }
}
