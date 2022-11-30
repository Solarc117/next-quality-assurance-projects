import SudokuHandler from '../../../modules/sudoku/sudoku-handler'

export default function check(req, res) {
  if (req.method === 'POST') return SudokuHandler.check(req, res)
}
