import app from "ags/gtk4/app"
import style from "./style.scss"
import Bar from "./widget/Bar"

app.start({
  instanceName: "Desktop",
  css: style,
  main() {
    app.get_monitors().map(Bar)
  },
})
