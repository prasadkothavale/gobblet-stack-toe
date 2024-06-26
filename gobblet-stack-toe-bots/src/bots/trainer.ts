import { GameConfig } from '@aehe-games/gobblet-stack-toe-engine/src/interface';
import * as fs from 'fs';
import * as path from 'path';
import * as ndjson from 'ndjson';
import { SimulatedGame } from "../simulator/simulation-result";

export default abstract class Trainer<T> {

    private _gameConfig: GameConfig;
    public get gameConfig(): GameConfig {
        return this._gameConfig;
    }
    public set gameConfig(value: GameConfig) {
        this._gameConfig = value;
    }

    private _inputFile: string;
    public get inputFile(): string {
        return this._inputFile;
    }
    public set inputFile(value: string) {
        this._inputFile = value;
    }

    private _outputFile: string;
    public get outputFile(): string {
        return this._outputFile;
    }
    public set outputFile(value: string) {
        this._outputFile = value;
    }

    private _trainingData: T[];
    public get trainingData(): T[] {
        return this._trainingData;
    }
    public set trainingData(value: T[]) {
        this._trainingData = value;
    }
    
    public abstract train(): Promise<any>

    /**
     * Loads a SimulatedGame from a JSON Lines (ndjson) file and passes it toTrainingData()
     *
     * @param {string} inputFile - The name of the input file containing simulated game data.
     * @returns {Promise<void>} - A promise that resolves when the data is loaded and processed.
     * @throws {Error} - If an error occurs during file reading or parsing.
     */
    public load(gameConfig: GameConfig, inputFile: string, outputFile: string): Promise<void> {
        this.gameConfig = gameConfig;
        this.inputFile = inputFile;
        this.outputFile = outputFile;
        this.trainingData = [];

        return new Promise((resolve, reject) => {
            const inputPath = path.join(__dirname, '..', 'data', inputFile);
            fs.createReadStream(inputPath)
                .pipe(ndjson.parse())
                .on('data', (simulatedGame: SimulatedGame) => this.toTrainingData(simulatedGame))
                .on('end', () => resolve())
                .on('error', (error) => reject(error));
        });
    }

    abstract toTrainingData(simulatedGame: SimulatedGame): void;
    
}