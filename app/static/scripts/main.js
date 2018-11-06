var spinClass;
var bulkUpdate;
var currentFilter= [];
var selectedDatasets = [];
window.onload = function() {
  bulkUpdate = false;
  var dataBtn = document.getElementById("showData");
  var pdfBtn = document.getElementById("downloadPDF");
  var savePlotBtn = document.getElementById("savePlots");
  var allBtn = document.getElementById("allDatasetsButton");
  var clearFilterBtn = document.getElementById("clearAllFiltersButton");

  var clearBtn = document.getElementById("clearSelection");
  var clearAllBtn = document.getElementById("clearAllSelection");

  dataBtn.onclick = function() {
    var data = document.getElementById("dataDiv");
    data.style.display = "block";
    return false;
  };

  pdfBtn.onclick = function() {
    //redirect to pdf.html with selected datasets
    //window.location.href = "{{ url_for('pdf') }}";
    post('/pdf', {name: 'Donnie Darko'});
    return false;
  };
  //Save Plot button is only visible if user is logged in
  if(savePlotBtn){
      savePlotBtn.onclick = function () {
      var plotNameInput = document.getElementById("plotName");
      if(plotNameInput.value == ''){
        alert('Please provide a name for the data set.');
        return false;
      }
      //post('/savePlot', {name: 'Set E',data:{{selected_datasets|tojson}} });
      post('/savePlot', {name: plotNameInput.value, data:selected_datasets_js });
      return false;
    };
  }
  allBtn.onclick = function () {
    var displayText = "<h4>Select a Dataset:</h4>";
    //Grab the 'hidden' form of the complete list of datasets
    var datasetForm = document.getElementById("datasets");
    for (datasetIndex=0; datasetIndex<datasetForm.options.length; datasetIndex++) {
         //Wrap the metadata in a clickable element- take action when the dataset is selected
         displayText += "<div class='filteredOption' onClick='selectDataset(this,"+datasetIndex+")'>";
         displayText += getMetadataDisplay(metadata[datasetIndex],datasetIndex);
         displayText += "</div>";
    }
    //Updated the selectable datasets from the filtered option
    var textElement = document.getElementById('filterDatasets');
    textElement.innerHTML = displayText;
  };

  clearFilterBtn.onclick = function () {
    var filters = document.getElementsByClassName("filterBox");
    for (var i = 0; i < filters.length; i++) {
      for (var j = 0; j < filters[i].options.length; j++) {
          filters[i].options[j].selected = false;
      }
    }
    //Updated the selectable datasets from the filtered option
    var textElement = document.getElementById('filterDatasets');
    textElement.innerHTML = '';
  };

  clearAllBtn.onclick = function () {
   var form = document.getElementById("datasets");
   for (i=0; i<form.options.length; i=i+1) {
     var meta = metadata[i];
     form.options[i].selected = false; //Deselect the selctions
   }
   currentFilter= [];
   bulkUpdate=true;
   displayMetadata(form);
  };

  clearBtn.onclick = function () {
    var datasetForm = document.getElementById("datasets");
    //Deselect all 'active' classes form the form
    var selectedSets = document.getElementsByClassName('active');
    //Grab the index from each element in the selected sets
    for (var i = 0; i < selectedSets.length; i++) {
      var index = $(selectedSets[i]).attr('data-index');
      datasetForm.options[index].selected = false; //Deselect the selctions
    }
    bulkUpdate=true;
    displayMetadata(datasetForm);
  };

  //Update the initial metadata
  var datasetForm = document.getElementById("datasets");
  displayMetadata(datasetForm);
};

function displayMetadata(form){
  checkSpinConsistency(form);
  //Generate the new metadata to display, depending if item is selected
  var displayText = "";
  displayText = getDatasetDisplayHeader();
  var index=0;
  for (i=0; i<form.options.length; i=i+1) {
    if (form.options[i].selected ) {
      displayText += getSelectedDatasetDisplay(metadata[i],i,index++);
    }
  }
  //Push the text to the html element
  var textElement = document.getElementById('datasetInfo');
  textElement.innerHTML = displayText;
}

/**
* Notes:
*  Only one filter is applied at a time.
*  No support for multiple selection within a certain filter (ie CMS and LUX will result in CMS only)
*  Does not clear other filter selections, so may appear as if multple selects are made.
**/
function updateFilter(){
  currentFilter = [];
  var filterFound = false;
  var datasetForm = document.getElementById("datasets");
  var filterBoxes = document.getElementsByClassName('filterBox');
  for (var i=0;i<filterBoxes.length;i++){
    var filterBox = filterBoxes[i];
    var filterType = $(filterBox).attr('data-filterType');
    for (var filterIndex=0; filterIndex<filterBox.options.length; filterIndex++) {

      if (filterBox.options[filterIndex].selected) {
        //Grab the filter from the selected value
        var filter = filterBox.options[filterIndex].value;
        //For each dataset option (pulled from the main selection form)
        if(!filterFound){
          for (datasetIndex=0; datasetIndex<datasetForm.options.length; datasetIndex++) {
            if(metadata[datasetIndex][filterType] == filter){
               currentFilter.push({'data':metadata[datasetIndex],'index':datasetIndex});
            }
          }
        }
        else{
          //Filter throught the filtered
          currentFilter = currentFilter.filter(function(dataset) {
            return dataset.data[filterType] == filter;
          });
        }
      }// if option is selected
    }
    //If data was filtered from this box selection, next filter option needs to filter from the filter
    if(currentFilter.length>0){
      filterFound = true;
    }
  }


  //Genrate the displayText from the (global) filtered set
  var displayText = "";
  for(index=0;index<currentFilter.length;index++){
    displayText += "<div class='filteredOption' onClick='selectDataset(this,"+currentFilter[index].index+")'>";
    displayText += getMetadataDisplay(currentFilter[index].data,index);
    displayText += "</div>";
  }

  //Updated the selectable datasets from the filtered option
  var textElement = document.getElementById('filterDatasets');
  textElement.innerHTML = displayText;
}

//Select/Deselect the dataset option from the master list
function selectDataset(element,datasetIndex){
  var datasetForm = document.getElementById("datasets");
  datasetForm.options[datasetIndex].selected = !(datasetForm.options[datasetIndex].selected);
  $(element).toggleClass('clickSelect');
  setTimeout(function(){ $(element).toggleClass('clickSelect'); }, 100);
  displayMetadata(datasetForm);
}

//Ensures all selected data sets have the same spin consistency
//Avoid checking if bulk update
function checkSpinConsistency(form){
  var errorIndex = -1;
  var count = 0;
  var localSpin = 0;
  for (i=0; i<form.options.length; i=i+1) {
    if (form.options[i].selected) {
      count++;
      //dataSelected = true;
      localSpin = metadata[i].spinDependency;
      if(spinClass){
        if(metadata[i].spinDependency != spinClass){
          //Deselect the error spin selection
          errorIndex = i;
        }
      }
      else{
        spinClass = metadata[i].spinDependency;
      }
    }
  }
  //If none are selected, (deselection from 1), then reset the spinClass
  if(count==0){
    spinClass = 0;
  }
  else if(count == 1){
    spinClass = localSpin;
  }
  else if(count>1 && errorIndex>=0 && !bulkUpdate){
    form.options[errorIndex].selected = false;
    alertSpinSelectError(spinClass);
  }
  bulkUpdate=false; //Reset the flag
}

function alertSpinSelectError(spinClass){
  alert('Please be consistant with your spin selection.');
}

function selectPlots(savedSelection){
  var datasetForm = document.getElementById("datasets");
  var selected = savedSelection.options[savedSelection.selectedIndex].innerHTML;
  var plotArray = plots[selected];

  for (i=0; i<datasetForm.options.length; i=i+1) {
    if(plotArray.indexOf(datasetForm.options[i].innerHTML) > -1){
      datasetForm.options[i].selected = true;
    }
    else{
      datasetForm.options[i].selected = false;
    }
  }
  datasetForm.focus();
  bulkUpdate = true;
  displayMetadata(datasetForm);
}

function getHeader(){
  var displayText = "";
  displayText += "<div class='row headerRow'>";
  displayText += "<div class='col'>Filename</div>";

  displayText += "<div class='col-1'>Spin</div>";

  displayText += "<div class='col-1'>Year</div>";
  displayText += "<div class='col'>Label</div>";
  displayText += "<div class='col col-5'><i>Comment</i></div>";
  displayText += "</div>";


  return displayText;
}
function getDatasetDisplayHeader(){
  var displayText = "";
  displayText += "<div class='row headerRow'>";
  displayText += "<div class='col'>Filename</div>";
  displayText += "<div class='col'>Label</div>";
  displayText += "</div>";


  return displayText;
}
function getSelectedDatasetDisplay(metadata,index,displayIndex){
  var displayText = "";
  var rowClass = "odd";
  if(displayIndex%2==0){ rowClass = "even"; }
  displayText += "<div class='row "+rowClass+"' data-index='"+index+"' onClick='selectDatasetDisplay(this)'>";
  displayText += "<div class='col'>" + metadata.fileName + "</div>";
  displayText += "<div class='col'>" + metadata.dataLabel + "</div>";
  displayText += "</div>";
  return displayText;
}
function selectDatasetDisplay(e){
  $(e).toggleClass( "active" );
}

function getMetadataDisplay(metadata,index){
  var displayText = "";
  var rowClass = "odd";
  if(index%2==0){ rowClass = "even"; }
  displayText += "<div class='row "+rowClass+"'>";
  displayText += "<div class='col'>" + metadata.fileName + "</div>";
  displayText += "<div class='col-1'>" + metadata.spinDependency + "</div>";
  displayText += "<div class='col-1'>" + metadata.year + "</div>";
  displayText += "<div class='col'>" + metadata.dataLabel + "</div>";
  displayText += "<div class='col col-5'><i>" + metadata.dataComment + "</i></div>";
  displayText += "</div>";
  return displayText;
}

function updateConditionalSelect(conditionalSelect){
  var selectedInput = "";
  var inputs = document.getElementsByName("conditional_input");
  for (var i = 0, length = inputs.length; i < length; i++) {
    if (inputs[i].checked) {
      // do whatever you want with the checked radio
      selectedInput = inputs[i].value;
      // only one radio can be logically checked, don't check the rest
      break;
    }
  }

  var form = document.getElementById("datasets");
  for (i=0; i<form.options.length; i=i+1) {
    var meta = metadata[i];
    //If this meta matches the selected input, then we select in form
    form.options[i].selected = false; //Deselect previous selction
    if(meta.spinDependency === selectedInput){
      form.options[i].selected = true;
    }
  }
  //Now make sure the metadata is correct
  bulkUpdate=true;
  displayMetadata(form);
}

/******************************************************************************/
function post(path, params, method) {
  method = method || "post"; // Set method to post by default if not specified.

  // The rest of this code assumes you are not using a library.
  // It can be made less wordy if you use one.
  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for(var key in params) {
      if(params.hasOwnProperty(key)) {
          var hiddenField = document.createElement("input");
          hiddenField.setAttribute("type", "hidden");
          hiddenField.setAttribute("name", key);
          hiddenField.setAttribute("value", params[key]);

          form.appendChild(hiddenField);
      }
  }

  var csrfField = document.createElement("input");
  csrfField.setAttribute("type", "hidden");
  csrfField.setAttribute("name", "csrf_token");
  csrfField.setAttribute("value", csrf);
  form.appendChild(csrfField);

  document.body.appendChild(form);
  form.submit();
}
