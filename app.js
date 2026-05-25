function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  var range = e.range;
  
  // 1. VERIFICATION DE L'ONGLET
  // Force le nom en MAJUSCULES et supprime les espaces pour éviter les erreurs
  var nomOngletActuel = sheet.getName().toUpperCase().trim();
  if (nomOngletActuel !== "DATA") return;
  if (range.getRow() === 1) return; // On ignore la ligne d'en-tête
  
  var col = range.getColumn();
  var row = range.getRow();
  var value = e.value;
  
  var spreadsheet = e.source;
  
  // 2. VERIFICATION DE L'ONGLET SOURCE
  // On cherche l'onglet des catégories sans se soucier des espaces ou majuscules
  var listSheet = null;
  var sheets = spreadsheet.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName().toUpperCase().trim();
    if (name === "LISTE_CATEGORIE" || name === "LISTE_CATÉGORIE") {
      listSheet = sheets[i];
      break;
    }
  }
  
  if (!listSheet) {
    Browser.msgBox("Erreur : Impossible de trouver l'onglet 'LISTE_catégorie'. Vérifiez son nom.");
    return;
  }
  
  var listData = listSheet.getRange("A2:C" + listSheet.getLastRow()).getValues();
  
  // CAS 1 : Modification de la CATÉGORIE (Colonne B = 2)
  if (col === 2) {
    sheet.getRange(row, 3, 1, 2).clearContent().clearDataValidations();
    if (!value) return;
    
    var postes = [];
    for (var i = 0; i < listData.length; i++) {
      if (listData[i][0].toString().trim() === value.trim() && listData[i][1] !== "") {
        var p = listData[i][1].toString().trim();
        if (postes.indexOf(p) === -1) {
          postes.push(p);
        }
      }
    }
    
    if (postes.length > 0) {
      var rule = SpreadsheetApp.newDataValidation().requireValueInList(postes).setAllowInvalid(false).build();
      sheet.getRange(row, 3).setDataValidation(rule);
    }
  }
  
  // CAS 2 : Modification du POSTE (Colonne C = 3)
  if (col === 3) {
    sheet.getRange(row, 4).clearContent().clearDataValidations();
    if (!value) return;
    
    var currentCat = sheet.getRange(row, 2).getValue().toString().trim();
    var descriptions = [];
    for (var i = 0; i < listData.length; i++) {
      if (listData[i][0].toString().trim() === currentCat && listData[i][1].toString().trim() === value.trim() && listData[i][2] !== "") {
        var d = listData[i][2].toString().trim();
        if (descriptions.indexOf(d) === -1) {
          descriptions.push(d);
        }
      }
    }
    
    if (descriptions.length > 0) {
      var rule = SpreadsheetApp.newDataValidation().requireValueInList(descriptions).setAllowInvalid(false).build();
      sheet.getRange(row, 4).setDataValidation(rule);
    }
  }
}
