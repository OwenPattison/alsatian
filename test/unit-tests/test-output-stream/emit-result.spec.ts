import { ITest } from "../../../core/_interfaces";
import {
  Expect,
  SpyOn,
  SpyOnProperty,
  Test,
  TestCase,
  TestCaseResult,
  TestOutputStream
} from "../../../core/alsatian-core";
import { EqualMatchError, MatchError } from "../../../core/errors";
import { TestBuilder } from "../../builders/test-builder";
import { TestOutcome } from "../../../core/results/test-outcome";

const _getErrorYaml: (error: MatchError) => string = (error: MatchError) => {
  return (
    ` ---\n` +
    `   message: "${error.message
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')}"\n` +
    `   severity: fail\n` +
    `   data:\n` +
    `     got: ${JSON.stringify(error.actual)}\n` +
    `     expect: ${JSON.stringify(error.expected)}\n ...\n`
  );
};

const _getUnhandledErrorMessage: (stack: string) => string = (
  stack: string
) => {
  return (
    " ---\n" +
    '   message: "The test threw an unhandled error."\n' +
    "   severity: fail\n" +
    "   data:\n" +
    "     got: an unhandled error\n" +
    "     expect: no unhandled errors to be thrown\n" +
    "     stack: |\n" +
    stack
      .split("\n")
      .map(l => "       " + l)
      .join("\n") +
    "\n" +
    " ...\n"
  );
};

function _getUnhandledErrorMessageNoStack(): string {
  return (
    " ---\n" +
    '   message: "The test threw an unhandled error."\n' +
    "   severity: fail\n" +
    "   data:\n" +
    "     got: an unhandled error\n" +
    "     expect: no unhandled errors to be thrown\n" +
    " ...\n"
  );
}

export class EmitResultTests {
  @TestCase(1)
  @TestCase(2)
  @TestCase(3)
  public shouldEmitWithCorrectTestId(testId: number) {
    const testOutput = new TestOutputStream();
    SpyOn(testOutput, "push");

    const test: ITest = new TestBuilder().build();

    const testCaseResult = new TestCaseResult(test, []);

    testOutput.emitResult(testId, testCaseResult);

    const expected = `ok ${testId} ${test.description}\n`;

    Expect(testOutput.push).toHaveBeenCalledWith(expected);
  }

  @TestCase("test that should pass")
  @TestCase("bla bla bla")
  @TestCase("hello this is a test")
  public shouldEmitWithCorrectTestDescription(description: string) {
    const testOutput = new TestOutputStream();
    SpyOn(testOutput, "push");

    const test: ITest = new TestBuilder().withDescription(description).build();

    const testCaseResult = new TestCaseResult(test, []);

    testOutput.emitResult(1, testCaseResult);

    const expected = `ok 1 ${description}\n`;

    Expect(testOutput.push).toHaveBeenCalledWith(expected);
  }

  @TestCase([1, 5, 7, 8], "( 1, 5, 7, 8 )")
  @TestCase(["a", 3, true], '( "a", 3, true )')
  @TestCase([5.25, 6.25, 7.22], "( 5.25, 6.25, 7.22 )")
  @TestCase([TypeError, RangeError], "( TypeError, RangeError )")
  @TestCase([() => "I am anonymous"], "( anonymous function )")
  @TestCase([undefined], "( undefined )")
  public shouldEmitWithCorrectCaseArguments(
    testCaseArguments: Array<any>,
    testCaseOutput: string
  ) {
    const testOutput = new TestOutputStream();
    SpyOn(testOutput, "push");

    const test: ITest = new TestBuilder().build();

    const testCaseResult = new TestCaseResult(test, testCaseArguments);

    testOutput.emitResult(1, testCaseResult);

    const expected = `ok 1 ${test.description} ${testCaseOutput}\n`;

    Expect(testOutput.push).toHaveBeenCalledWith(expected);
  }

  @Test()
  public shouldEmitWithOkIfPass() {
    const testOutput = new TestOutputStream();
    SpyOn(testOutput, "push");

    const test: ITest = new TestBuilder().build();

    const testCaseResult = new TestCaseResult(test, []);

    testOutput.emitResult(1, testCaseResult);

    const expected = `ok 1 ${test.description}\n`;

    Expect(testOutput.push).toHaveBeenCalledWith(expected);
  }

  @Test()
  public shouldEmitWithNotOkIfPass() {
    const testOutput = new TestOutputStream();
    SpyOn(testOutput, "push");

    const test: ITest = new TestBuilder().build();

    // match error causes a "fail"
    const testCaseResult = new TestCaseResult(
      test,
      [],
      new MatchError("message", 1, 2)
    );

    testOutput.emitResult(1, testCaseResult);

    const expected = `not ok 1 ${test.description}\n`;

    Expect(testOutput.push).toHaveBeenCalledWith(expected);
  }

  @Test()
  public shouldEmitSkipCorrectly() {
    const testOutput = new TestOutputStream();
    SpyOn(testOutput, "push");

    const test: ITest = new TestBuilder().ignored().build();

    const testCaseResult = new TestCaseResult(test, []);

    testOutput.emitResult(1, testCaseResult);

    const expected = `ok 1 ${test.description} # skip\n`;

    Expect(testOutput.push).toHaveBeenCalledWith(expected);
  }

  @TestCase("first reason")
  @TestCase("this reason is the second one!")
  @TestCase("last, but most certainly not least")
  public shouldEmitSkipWithReasonCorrectly(reason: string) {
    const testOutput = new TestOutputStream();
    SpyOn(testOutput, "push");

    const test: ITest = new TestBuilder().ignored(reason).build();

    const testCaseResult = new TestCaseResult(test, []);

    testOutput.emitResult(1, testCaseResult);

    const expected = `ok 1 ${test.description} # skip ${reason}\n`;

    Expect(testOutput.push).toHaveBeenCalledWith(expected);
  }

  @Test()
  public shouldEmitErrorCorrectly() {
    const testOutput = new TestOutputStream();
    SpyOn(testOutput, "push");

    const test: ITest = new TestBuilder().build();

    // any error apart from a MatchError causes an "error" outcome
    const testCaseResult = new TestCaseResult(
      test,
      [],
      new Error("an error occured when running the test")
    );

    testOutput.emitResult(1, testCaseResult);

    const expected = `not ok 1 ${test.description}\n`;

    Expect(testOutput.push).toHaveBeenCalledWith(expected);
  }

  @TestCase("message one")
  @TestCase("another message")
  @TestCase("yaba daba doo")
  public shouldEmitYamlWithCorrectMessage(message: string) {
    const testOutput = new TestOutputStream();
    SpyOn(testOutput, "push");

    const test: ITest = new TestBuilder().build();

    const error = new MatchError(message, 1, 2);

    const testCaseResult = new TestCaseResult(test, [], error);

    const expected = _getErrorYaml(error);

    testOutput.emitResult(1, testCaseResult);

    Expect(testOutput.push).toHaveBeenCalledWith(expected);
  }

  @TestCase(5)
  @TestCase("tweny")
  @TestCase(false)
  public shouldEmitYamlWithCorrectActualValue(actualValue: any) {
    const testOutput = new TestOutputStream();
    SpyOn(testOutput, "push");

    const test: ITest = new TestBuilder().build();

    const error = new EqualMatchError(actualValue, 2, true);

    const testCaseResult = new TestCaseResult(test, [], error);

    const expected = _getErrorYaml(error);

    testOutput.emitResult(1, testCaseResult);

    Expect(testOutput.push).toHaveBeenCalledWith(expected);
  }

  @TestCase("five")
  @TestCase(20)
  @TestCase(true)
  public shouldEmitYamlWithCorrectExpectedValue(expectedValue: any) {
    const testOutput = new TestOutputStream();
    SpyOn(testOutput, "push");

    const test: ITest = new TestBuilder().build();

    const error = new EqualMatchError(1, expectedValue, true);

    const testCaseResult = new TestCaseResult(test, [], error);

    const expected = _getErrorYaml(error);

    testOutput.emitResult(1, testCaseResult);

    Expect(testOutput.push).toHaveBeenCalledWith(expected);
  }

  @TestCase(100)
  @TestCase(42)
  @TestCase(-42)
  public invalidResultOutcomeThrowsError(testOutcome: number) {
    const testCaseResult = { outcome: testOutcome } as TestCaseResult;

    const testOutput = new TestOutputStream();

    Expect(() => testOutput.emitResult(1, testCaseResult)).toThrowError(
      TypeError,
      `Invalid test outcome: ${testOutcome}`
    );
  }

  @TestCase("line 1\nline3\nline 7")
  @TestCase(
    "function foo in a.ts\nfunction bar in z.ts\nfunction x in entry.ts"
  )
  public shouldEmitCorrectUnhandledErrorStack(stack: string) {
    const testOutput = new TestOutputStream();
    SpyOn(testOutput, "push");

    const test: ITest = new TestBuilder().build();

    const error = new Error("empty message");
    error.stack = stack;

    const testCaseResult = new TestCaseResult(test, [], error);

    const expected = _getUnhandledErrorMessage(stack);

    testOutput.emitResult(1, testCaseResult);

    Expect(testOutput.push).toHaveBeenCalledWith(expected);
  }

  @TestCase(undefined)
  @TestCase(null)
  public shouldEmitCorrectUnhandledErrorWithUndefOrNullError(
    error: Error | null
  ) {
    const testOutput = new TestOutputStream();
    SpyOn(testOutput, "push");

    const test: ITest = new TestBuilder().build();

    const testCaseResult = new TestCaseResult(test, [], error);
    SpyOnProperty(testCaseResult, "outcome").andCallGetter(
      () => TestOutcome.Error
    );

    const expected = _getUnhandledErrorMessageNoStack();

    testOutput.emitResult(1, testCaseResult);

    Expect(testOutput.push).toHaveBeenCalledWith(expected);
  }
}