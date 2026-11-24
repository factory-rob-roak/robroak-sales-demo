## QA Report

| #   | Test Case | App | Persona | Result | Notes |
| --- | --------- | --- | ------- | ------ | ----- |
{{TEST_ROWS}}

Result values: :white_check_mark: PASS, :x: FAIL, :no_entry: BLOCKED, :warning: FLAKY, :grey_question: INCONCLUSIVE

{{#if ACTIONABLE_ITEMS}}

### Action Required

{{ACTIONABLE_ITEMS}}
{{/if}}

{{#if CI_CHECKS}}

### Checks on `{{HEAD_SHA_SHORT}}`

{{CI_CHECKS}}
{{/if}}

{{#if EVIDENCE}}

<details>
<summary>Screenshots & Evidence</summary>

{{EVIDENCE}}

</details>
{{/if}}

{{#if SKILL_UPDATES}}

{{SKILL_UPDATES}}
{{/if}}
