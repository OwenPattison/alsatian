import { Expect, Test, TestCase } from "../../../core/alsatian-core";
import { MatchError } from "../../../core/errors/match-error";
import { INameable } from "../../../core/_interfaces";

export class ToThrowTests {
	@Test()
	public functionThrowsErrorPasses() {
		const throwFunction = () => {
			throw new Error();
		};

		Expect(() => Expect(throwFunction).toThrow()).not.toThrow();
	}

	@Test()
	public functionDoesNotThrowErrorFails() {
		const nonThrowFunction = () => {};

		Expect(() => Expect(nonThrowFunction).toThrow()).toThrow();
	}

	@Test()
	public functionDoesNotThrowErrorFailsWithCorrectError() {
		const nonThrowFunction = () => {};

		Expect(() => Expect(nonThrowFunction).toThrow()).toThrowError(
			MatchError,
			"Expected an error to be thrown but no errors were thrown."
		);
	}

	@Test()
	public functionDoesNotThrowErrorPassesWhenShouldNotThrow() {
		const nonThrowFunction = () => {};

		Expect(() => Expect(nonThrowFunction).not.toThrow()).not.toThrow();
	}

	@Test()
	public functionThrowsErrorFailsWhenShouldNotThrow() {
		const throwFunction = () => {
			throw new Error();
		};

		Expect(() => Expect(throwFunction).not.toThrow()).toThrow();
	}

	@Test()
	public functionThrowsErrorFailsWithCorrectError() {
		const throwFunction = () => {
			throw new Error();
		};

		Expect(() => Expect(throwFunction).not.toThrow()).toThrowError(
			MatchError,
			"Expected an error not to be thrown but an error was thrown."
		);
	}

	@Test()
	public actualValueAndShouldMatchShouldBeSetToErrorWasNotThrown() {
		let errorMatchError: MatchError;

		try {
			Expect(() => {}).toThrow();
		} catch (error) {
			errorMatchError = error;
		}

		Expect(errorMatchError).toBeDefined();
		Expect(errorMatchError).not.toBeNull();
		Expect(errorMatchError.extras.errorThrown).toBe("none");
	}

	@TestCase(EvalError, "something went wrong")
	@TestCase(ReferenceError, "A much worse thing happened!")
	@TestCase(SyntaxError, "THE END IS NIGH")
	public actualValueAndShouldNotMatchShouldBeSetToErrorWasThrown(
		actualErrorType: new (message: string) => Error,
		actualErrorMessage: string
	) {
		let errorMatchError: MatchError;

		try {
			Expect(() => {
				throw new actualErrorType(actualErrorMessage);
			}).not.toThrow();
		} catch (error) {
			errorMatchError = error;
		}

		Expect(errorMatchError).toBeDefined();
		Expect(errorMatchError).not.toBeNull();
		Expect(errorMatchError.extras.errorThrown).toBe(
			`${(actualErrorType as INameable).name}: ${actualErrorMessage}`
		);
	}

	@Test()
	public actualValueAndShouldMatchShouldBeSetToErrorToBeThrown() {
		let errorMatchError: MatchError;

		try {
			Expect(() => {}).toThrow();
		} catch (error) {
			errorMatchError = error;
		}

		Expect(errorMatchError).toBeDefined();
		Expect(errorMatchError).not.toBeNull();
		Expect(errorMatchError.expected).toBe("an error thrown");
	}

	@Test()
	public expectedValueAndShouldNotMatchShouldBeSetToErrorNotToBeThrown() {
		let errorMatchError: MatchError;

		try {
			Expect(() => {
				throw new Error();
			}).not.toThrow();
		} catch (error) {
			errorMatchError = error;
		}

		Expect(errorMatchError).toBeDefined();
		Expect(errorMatchError).not.toBeNull();
		Expect(errorMatchError.expected).toBe("no errors thrown");
	}
}
