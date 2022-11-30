import SudokuHandler from '../../../modules/sudoku/sudoku-handler'

export default function solve(req, res) {
  if (req.method === 'POST') return SudokuHandler.solve(req, res)
}
