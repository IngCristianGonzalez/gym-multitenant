{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testEnvironment": "node",
  "testRegex": ".spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironmentOptions": {
    "url": "http://localhost"
  }
}
