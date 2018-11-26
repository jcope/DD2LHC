

var m_spinClass; //Used to track if user is in process of selecting SI/SD datasets and enfocing consistency
var m_bulkUpdate; //Flag to set if more than dataset was selected at once (load saved plot configurations)
var m_datasetForm;
var m_filteredDatasets = []; //Stores datasets displayed as a result of the filters

window.onload = function() {
  m_bulkUpdate = false;
  m_datasetForm = document.getElementById("datasets");

  var dataBtn = document.getElementById("showData");
  var pdfBtn = document.getElementById("downloadPDF");
  var savePlotBtn = document.getElementById("savePlots");
  var allBtn = document.getElementById("allDatasetsButton");
  var clearFilterBtn = document.getElementById("clearAllFiltersButton");

  var clearBtn = document.getElementById("clearSelection");
  var clearAllBtn = document.getElementById("clearAllSelection");

  //Show the raw data calculations (hidden in a div by default)
  dataBtn.onclick = function() {
    var data = document.getElementById("dataDiv");
    data.style.display = "block";
    return false;
  };

  //Redirect to pdf.html with selected datasets
  pdfBtn.onclick = function() {
    post('/pdf', {name: 'DMLimiter_Plot.pdf'});
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

  //Show all available datasets in the 'filtered' selection box
  allBtn.onclick = function () {
    var displayText = "<h4>Select a Dataset:</h4>";
    //Grab the 'hidden' form of the complete list of datasets
    for (datasetIndex=0; datasetIndex<m_datasetForm.options.length; datasetIndex++) {
         //Wrap the metadata in a clickable element- take action when the dataset is selected
         displayText += "<div class='filteredOption' onClick='selectDataset(this,"+datasetIndex+")'>";
         displayText += getFilteredDatasetDisplay(m_datasetMetadata[datasetIndex],datasetIndex);
         displayText += "</div>";
    }
    //Updated the selectable datasets from the filtered option
    var textElement = document.getElementById('filteredDatasets');
    textElement.innerHTML = displayText;
  };

  //Clear all filters and remove all filtered sets
  clearFilterBtn.onclick = function () {
    var filters = document.getElementsByClassName("filterBox");
    for (var i = 0; i < filters.length; i++) {
      for (var j = 0; j < filters[i].options.length; j++) {
          filters[i].options[j].selected = false;
      }
    }
    //Updated the selectable datasets from the filtered option
    var textElement = document.getElementById('filteredDatasets');
    textElement.innerHTML = '';
  };

  //Clears all the selected datasets, make sure to update the UI wrapper
  clearAllBtn.onclick = function () {
   for (i=0; i<m_datasetForm.options.length; i=i+1) {
     m_datasetForm.options[i].selected = false; //Deselect the selctions
   }
   m_filteredDatasets= [];
   m_bulkUpdate=true;
   updateSelectedDatasets();
  };

  //Clears the current selected datasets from the datasets to plot
  clearBtn.onclick = function () {
    //Deselect all 'active' classes form the form
    var selectedSets = document.getElementsByClassName('active');
    //Grab the index from each element in the selected sets
    for (var i = 0; i < selectedSets.length; i++) {
      var index = $(selectedSets[i]).attr('data-index');
      m_datasetForm.options[index].selected = false; //Deselect the selctions
    }
    m_bulkUpdate=true;
    updateSelectedDatasets();
  };

  //Update the initial metadata
  updateSelectedDatasets();
};

/**
* Called when a filter selection is made
* We use the first selection found to filter through the datasets,
* subsequent selected filters are then filtered through this filtered set.
* Filter is applied by grabbing the filterType as determined by the HTML filterBox
* This filterType is then used as a key in the metadata to match the users selection
**/
function updateFilter(){
  m_filteredDatasets = [];
  var filterFound = false;
  var filterBoxes = document.getElementsByClassName('filterBox');
  for (var i=0;i<filterBoxes.length;i++){
    var filterBox = filterBoxes[i];
    var filterType = $(filterBox).attr('data-filterType');
    for (var filterIndex=0; filterIndex<filterBox.options.length; filterIndex++) {

      if (filterBox.options[filterIndex].selected) {
        //Grab the filter from the selected value
        var filterSelection = filterBox.options[filterIndex].value;
        //For each dataset option (pulled from the main selection form)
        if(!filterFound){
          for (datasetIndex=0; datasetIndex<m_datasetForm.options.length; datasetIndex++) {
            if(m_datasetMetadata[datasetIndex][filterType] == filterSelection){
               //Need to store the absolute index of the dataset within the m_datasetForm
               m_filteredDatasets.push({'data':m_datasetMetadata[datasetIndex],'index':datasetIndex});
            }
          }
        }
        else{
          //Filter through the filtered
          m_filteredDatasets = m_filteredDatasets.filter(function(dataset) {
            return dataset.data[filterType] == filterSelection;
          });
        }
      }// if option is selected
    }
    //If data was filtered from this box selection, next filter option needs to filter from the filter
    if(m_filteredDatasets.length>0){
      filterFound = true;
    }
  }

  //Genrate the displayText from the (global) filtered set
  var displayText = "";
  for(index=0;index<m_filteredDatasets.length;index++){
    displayText += "<div class='filteredOption' onClick='selectDataset(this,"+m_filteredDatasets[index].index+")'>";
    displayText += getFilteredDatasetDisplay(m_filteredDatasets[index].data,index);
    displayText += "</div>";
  }

  //Updated the selectable datasets from the filtered option
  var textElement = document.getElementById('filteredDatasets');
  textElement.innerHTML = displayText;
}

/******************************************************************************/

//Called from the datasetForm wrapper, on user click of filtered datasets
//Select/Deselect the dataset option from the master list
//Update the Select list of datasets
function selectDataset(element,datasetIndex){
  m_datasetForm.options[datasetIndex].selected = !(m_datasetForm.options[datasetIndex].selected);
  $(element).toggleClass('clickSelect');
  setTimeout(function(){ $(element).toggleClass('clickSelect'); }, 100);
  updateSelectedDatasets();
}

//Updates
//**Checks to make sure all selected datasets have the same spinDependency
//If not-> deselects the invalid selection and presents user with warning
function updateSelectedDatasets(){
  checkSpinConsistency();
  //Generate the new metadata to display, depending if item is selected
  var displayText = "";
  var index=0;
  for (i=0; i<m_datasetForm.options.length; i=i+1) {
    if (m_datasetForm.options[i].selected ) {
      displayText += getSelectedDatasetDisplay(m_datasetMetadata[i],i,index++);
    }
  }
  //Push the text to the html element
  var textElement = document.getElementById('selectedDatasets');
  textElement.innerHTML = displayText;
}

/******************************************************************************/
//Called when a saved configuration is selected from the saved plots
//Loads the set of selected datasets from the configuration file.
function loadSavedPlot(savedSelection){
  var selected = savedSelection.options[savedSelection.selectedIndex].innerHTML;
  var plotArray = m_savedPlots[selected];

  for (i=0; i<m_datasetForm.options.length; i=i+1) {
    if(plotArray.indexOf(m_datasetForm.options[i].innerHTML) > -1){
      m_datasetForm.options[i].selected = true;
    }
    else{
      m_datasetForm.options[i].selected = false;
    }
  }
  m_datasetForm.focus();
  m_bulkUpdate = true;
  updateSelectedDatasets();
}

//Ensures all selected data sets have the same spin consistency
//Avoid enforcing if m_bulkUpdate is true --This is useful if a saved set of data sets are loaded,
//we don't want to check that they match the previous spin selection 'type'
function checkSpinConsistency(){
  var errorIndex = -1;
  var count = 0;
  var localSpin = 0;
  var errorSpin = '';
  for (i=0; i<m_datasetForm.options.length; i=i+1) {
    if (m_datasetForm.options[i].selected) {
      count++;
      localSpin = m_datasetMetadata[i].spinDependency;
      if(m_spinClass){
        if(m_datasetMetadata[i].spinDependency != m_spinClass){
          //Deselect the error spin selection
          errorIndex = i;
          errorSpin = m_datasetMetadata[i].spinDependency;
        }
      }
      else{
        m_spinClass = m_datasetMetadata[i].spinDependency;
      }
    }
  }
  //If none are selected, (deselection from 1), then reset the m_spinClass
  if(count==0){
    m_spinClass = 0;
  }
  else if(count == 1){
    m_spinClass = localSpin;
  }
  else if(count>1 && errorIndex>=0 && !m_bulkUpdate){
    m_datasetForm.options[errorIndex].selected = false;
    alertSpinSelectError(errorSpin);
  }
  m_bulkUpdate=false; //Reset the flag
}

//Present user with error, selected spin was not consistant with previous selection(s).
function alertSpinSelectError(selectedSpin){
  var message = 'Please be consistant with your spin selection.';
  message += ' You selected '+selectedSpin+', previous selection was '+m_spinClass+'.';
  alert(message);
}

/****************************************************************************
  HTML Code Generators
* Create the HTML with css styling tags to be used to dynamically change the
* site as user interacts
*****************************************************************************/

//Generates the HTML text for given metadata, displayIndex determines style, even/odd rows.
function getFilteredDatasetDisplay(metadata,displayIndex){
  var displayText = "";
  var rowClass = "odd";
  if(displayIndex%2==0){ rowClass = "even"; }
  displayText += "<div class='row "+rowClass+"'>";
  displayText += "<div class='col'>" + metadata.fileName + "</div>";
  displayText += "<div class='col-1'>" + metadata.spinDependency + "</div>";
  displayText += "<div class='col-1'>" + metadata.year + "</div>";
  displayText += "<div class='col'>" + metadata.dataLabel + "</div>";
  displayText += "<div class='col col-5'><i>" + metadata.dataComment + "</i></div>";
  displayText += "</div>";
  return displayText;
}

//Generates the HTML text for the selected dataset (to be plotted)
//index is key into m_datasetForm, the master list of datasets.
//displayIndex determines style, even/odd rows
function getSelectedDatasetDisplay(metadata,index,displayIndex){
  var displayText = "";
  var rowClass = "odd";
  if(displayIndex%2==0){ rowClass = "even"; }
  displayText += "<div class='row "+rowClass+"' data-index='"+index+"' onClick='toggleSelectedDataset(this)'>";
  displayText += "<div class='col'>" + metadata.fileName + "</div>";
  displayText += "<div class='col'>" + metadata.dataLabel + "</div>";
  displayText += "</div>";
  return displayText;
}
function toggleSelectedDataset(e){
  $(e).toggleClass( "active" );
}
/*****************************************************************************
 * Utility Functions
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
