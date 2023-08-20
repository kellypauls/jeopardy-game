const numOfCategories = 6;
const numOfClues =5;
const $button = $('button');
const $table = $('#table')

// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];


/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
    const res = await axios.get('http://jservice.io/api/categories', {params: { count : 99}})
    // mapping through data to see which categories had 5 or fewer clues
    const tooFewClues = res.data.map(clues => clues.clues_count) 
    const goodCategories = tooFewClues.reduce(function(newArr, clues){
        if (clues >= 5){
            newArr.push(clues)
        }
        return newArr
    },[]);
    // mapping through results data to get ids
    const catsArr = res.data.map(res => res.id);
    // reducing that array to remove the categories that had fewer than 5 clues
    const categoryIds = catsArr.reduce(function(resArr, res){
    if ((res !== 1) && (res !== 37) && (res !== 21) && (res !== 70) && (res !== 34) && (res !== 78)){
        resArr.push(res)
    }
    return resArr
}, []);
//using lodash method to randomize categories and select 6 for our game
    return _.sampleSize(categoryIds, numOfCategories)
}


/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
    // creating url to plug in category ID
    const url = `http://jservice.io/api/category?id=${catId}`;
    const cat = await axios.get(url);
    // getting the clues into an array
    const clueData = cat.data.clues;
    // randomizing clues and selecting 5 to put in our objects
    const clueRandomizer = _.sampleSize(clueData, numOfClues)
    const clues = clueRandomizer.map(clue => ({
        question: clue.question,
        answer: clue.answer,
        showing: null,
    }));
    return { title : cat.data.title, clues}
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
    // emptying the head section
    $("#jeopardy thead").empty();
    let $head = $('thead')
    // looping over categories and creating a th for each one
    for (let h = 0; h < numOfCategories; h++){
        let $cat = $('<th>')
        // adding text based on index
        .text(categories[h].title).attr('id', `cat-${h}`)
        // appending categories to head section
        $head.append($cat);
    }
    //appending  categories to the row
    $('#jeopardy thead').append($head);

    $('#jeopardy tbody').empty();
    // nested loop to assign clues based on categories
    for (let clue = 0; clue < numOfClues; clue++){
        let $row = $('<tr>');
        for (let cat = 0; cat < numOfCategories; cat++){
        // putting in the question mark to hold the place in the td
        let $pHolder = $('<i>')
        .attr("class", "fas fa-question-circle")
        let $cell = $('<td>')
        // adding our id to call on later for questions and answers
        .attr('id', `${cat}-${clue}`).append($pHolder);
        // appending cells to the row
        $row.append($cell)
        }
        // appending rows to the body section
        $('#jeopardy tbody').append($row);
    }
}


/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
    // prevent skipping clicks on reload
    evt.stopImmediatePropagation();
    let id = evt.target.id;
    // giving the td an id to call later to give it text
    const $td = $(`#${id}`)
    // splitting the id into two variables to find category and clue number
    let [catID, clueID] = id.split("-");
    

    let clickedCell = categories[catID].clues[clueID]
    let questions = clickedCell.question;
    let answers = clickedCell.answer;

    if(clickedCell.showing === null){
        // if the cell we click is showing null, add text to the td and change the showing to question
        clickedCell.showing = "question";
        $td.text(questions);
    } else if (clickedCell.showing === "question"){
        // if the td is showing question then we add answer on click and change showing to answer
        $td.toggleClass('answer');
        $td.text(answers);
        clickedCell.showing = "answer";
    } 
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
    //change button text so user can know game is loading
    $button.text("Game is loading...");
    //empty the table
    $table.empty();
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
    // once the game has been started the button will change to restart game for the next game
    $button.text("Restart Game!");
    $table.empty();
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
    showLoadingView();
    let categoryIds = await getCategoryIds();
    categories = [];
    for (let id of categoryIds){
        categories.push(await getCategory(id))
    };
    hideLoadingView();
    fillTable();
    addEventListeners();
}



/** On click of start / restart button, set up game. */

$("#start").on("click", setupAndStart);

/** On page load, add event handler for clicking clues */

function addEventListeners (){
    $('#jeopardy').on('click','td', handleClick)
}