/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  COLLAPSED_ACTION_BTN,
  ELASTIC_RULES_BTN,
  pageSelector,
  RELOAD_PREBUILT_RULES_BTN,
  RULES_EMPTY_PROMPT,
  RULE_SWITCH,
  SHOWING_RULES_TEXT,
  RULES_MONITORING_TABLE,
  SELECT_ALL_RULES_ON_PAGE_CHECKBOX,
} from '../../screens/alerts_detection_rules';

import {
  changeRowsPerPageTo100,
  deleteFirstRule,
  deleteSelectedRules,
  loadPrebuiltDetectionRules,
  reloadDeletedRules,
  selectNumberOfRules,
  waitForPrebuiltDetectionRulesToBeLoaded,
  selectAllRules,
  confirmRulesDelete,
  enableSelectedRules,
  waitForRuleToChangeStatus,
  disableSelectedRules,
  changeRowsPerPageTo,
} from '../../tasks/alerts_detection_rules';
import { loginAndWaitForPageWithoutDateRange } from '../../tasks/login';

import { DETECTIONS_RULE_MANAGEMENT_URL } from '../../urls/navigation';

import { totalNumberOfPrebuiltRules } from '../../objects/rule';
import { cleanKibana } from '../../tasks/common';

describe('Alerts rules, prebuilt rules', () => {
  beforeEach(() => {
    cleanKibana();
  });

  it('Loads prebuilt rules', () => {
    const rowsPerPage = 100;
    const expectedNumberOfRules = totalNumberOfPrebuiltRules;
    const expectedNumberOfPages = Math.ceil(totalNumberOfPrebuiltRules / rowsPerPage);
    const expectedElasticRulesBtnText = `Elastic rules (${expectedNumberOfRules})`;

    loginAndWaitForPageWithoutDateRange(DETECTIONS_RULE_MANAGEMENT_URL);
    loadPrebuiltDetectionRules();
    waitForPrebuiltDetectionRulesToBeLoaded();

    cy.get(ELASTIC_RULES_BTN).should('have.text', expectedElasticRulesBtnText);

    changeRowsPerPageTo(rowsPerPage);

    cy.get(SHOWING_RULES_TEXT).should('have.text', `Showing ${expectedNumberOfRules} rules`);
    cy.get(pageSelector(expectedNumberOfPages)).should('exist');
  });
});

describe('Actions with prebuilt rules', () => {
  beforeEach(() => {
    const expectedNumberOfRules = totalNumberOfPrebuiltRules;
    const expectedElasticRulesBtnText = `Elastic rules (${expectedNumberOfRules})`;

    cleanKibana();
    loginAndWaitForPageWithoutDateRange(DETECTIONS_RULE_MANAGEMENT_URL);
    loadPrebuiltDetectionRules();
    waitForPrebuiltDetectionRulesToBeLoaded();

    cy.get(ELASTIC_RULES_BTN).should('have.text', expectedElasticRulesBtnText);
  });

  context('Rules table', () => {
    it('Allows to enable/disable all rules at once', () => {
      selectAllRules();
      enableSelectedRules();
      waitForRuleToChangeStatus();
      cy.get(RULE_SWITCH).should('have.attr', 'aria-checked', 'true');

      selectAllRules();
      disableSelectedRules();
      waitForRuleToChangeStatus();
      cy.get(RULE_SWITCH).should('have.attr', 'aria-checked', 'false');
    });

    it('Allows to delete all rules at once', () => {
      selectAllRules();
      deleteSelectedRules();
      confirmRulesDelete();
      cy.get(RULES_EMPTY_PROMPT).should('be.visible');
    });

    it('Does not allow to delete one rule when more than one is selected', () => {
      changeRowsPerPageTo100();

      const numberOfRulesToBeSelected = 2;
      selectNumberOfRules(numberOfRulesToBeSelected);

      cy.get(COLLAPSED_ACTION_BTN).each((collapsedItemActionBtn) => {
        cy.wrap(collapsedItemActionBtn).should('have.attr', 'disabled');
      });
    });

    it('Deletes and recovers one rule', () => {
      changeRowsPerPageTo100();

      const expectedNumberOfRulesAfterDeletion = totalNumberOfPrebuiltRules - 1;
      const expectedNumberOfRulesAfterRecovering = totalNumberOfPrebuiltRules;

      deleteFirstRule();
      cy.reload();
      changeRowsPerPageTo100();

      cy.get(ELASTIC_RULES_BTN).should(
        'have.text',
        `Elastic rules (${expectedNumberOfRulesAfterDeletion})`
      );
      cy.get(RELOAD_PREBUILT_RULES_BTN).should('exist');
      cy.get(RELOAD_PREBUILT_RULES_BTN).should('have.text', 'Install 1 Elastic prebuilt rule ');

      reloadDeletedRules();

      cy.get(RELOAD_PREBUILT_RULES_BTN).should('not.exist');

      cy.reload();
      changeRowsPerPageTo100();

      cy.get(ELASTIC_RULES_BTN).should(
        'have.text',
        `Elastic rules (${expectedNumberOfRulesAfterRecovering})`
      );
    });

    it('Deletes and recovers more than one rule', () => {
      changeRowsPerPageTo100();

      const numberOfRulesToBeSelected = 2;
      const expectedNumberOfRulesAfterDeletion = totalNumberOfPrebuiltRules - 2;
      const expectedNumberOfRulesAfterRecovering = totalNumberOfPrebuiltRules;

      selectNumberOfRules(numberOfRulesToBeSelected);
      deleteSelectedRules();
      cy.reload();
      changeRowsPerPageTo100();

      cy.get(RELOAD_PREBUILT_RULES_BTN).should('exist');
      cy.get(RELOAD_PREBUILT_RULES_BTN).should(
        'have.text',
        `Install ${numberOfRulesToBeSelected} Elastic prebuilt rules `
      );
      cy.get(ELASTIC_RULES_BTN).should(
        'have.text',
        `Elastic rules (${expectedNumberOfRulesAfterDeletion})`
      );

      reloadDeletedRules();

      cy.get(RELOAD_PREBUILT_RULES_BTN).should('not.exist');

      cy.reload();
      changeRowsPerPageTo100();

      cy.get(ELASTIC_RULES_BTN).should(
        'have.text',
        `Elastic rules (${expectedNumberOfRulesAfterRecovering})`
      );
    });
  });

  context('Rule monitoring table', () => {
    it('Allows to enable/disable all rules at once', () => {
      cy.get(RULES_MONITORING_TABLE).click();

      cy.get(SELECT_ALL_RULES_ON_PAGE_CHECKBOX).click();
      enableSelectedRules();
      waitForRuleToChangeStatus();
      cy.get(RULE_SWITCH).should('have.attr', 'aria-checked', 'true');

      selectAllRules();
      disableSelectedRules();
      waitForRuleToChangeStatus();
      cy.get(RULE_SWITCH).should('have.attr', 'aria-checked', 'false');
    });
  });
});
