import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { exec, execAsync } from "ags/process"
import { createPoll } from "ags/time"
import AstalHyprland from "gi://AstalHyprland?version=0.1"
import MenuButton from "./modules/MenuButton"

function Workspaces() {
  const hypr = AstalHyprland.get_default()

  return (
    <box class="workspaces" spacing={1}>
      {hypr.get_workspaces()
        .sort((a, b) => a.id - b.id)
        .map(ws => (
          <button
            class={hypr.get_focused_workspace().id === ws.id ? "workspace-button active" : "workspace-button"}
            onClicked={() => hypr.dispatch("workspace", ws.id.toString())}
          >
            {ws.id}
          </button>
        ))
      }
    </box>
  )
}

export default function Bar(gdkmonitor: Gdk.Monitor) {
  const time = createPoll("", 1000, "date '+%a %b %d %I:%M %p'")
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor
  return (
    <window
      visible
      name="bar"
      class="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox>
        <box $type="start">
          <Workspaces />
        </box>
        <menubutton $type="center" hexpand halign={Gtk.Align.CENTER}>
          <label label={time} />
          <popover>
            <Gtk.Calendar />
          </popover>
        </menubutton>
        <MenuButton />
      </centerbox>

    </window>
  )
}
