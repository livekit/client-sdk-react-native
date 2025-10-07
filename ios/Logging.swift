public func lklog(_ object: Any, functionName: String = #function, fileName: String = #file, lineNumber: Int = #line) {
  let className = (fileName as NSString).lastPathComponent
  print("\(className).\(functionName):\(lineNumber) : \(object)\n")
}
