import { Astal, Gtk } from "ags/gtk4";
import { exec, execAsync } from "ags/process"
import { createPoll } from "ags/time";

const _spacing = 4;

async function getWifiStrengthIcon(): Promise<string> {
  try {
    const strength = new Promise<String>((resolve) => {
      const strengthCmd = execAsync("sh -c 'nmcli -t -f signal device wifi list --rescan yes | head -n 1 | cut -d: -f8'");
      resolve(strengthCmd);
    });

    const percent = parseInt((await strength).split('\n')[0].trim());

    if (isNaN(percent) || percent < 1) return "network-wireless-symbolic";
    if (percent >= 90) return "network-wireless-signal-excellent-symbolic";
    if (percent >= 70) return "network-wireless-signal-good-symbolic";
    if (percent >= 50) return "network-wireless-signal-ok-symbolic";
    if (percent >= 30) return "network-wireless-signal-weak-symbolic";

    return "network-wireless-signal-none-symbolic";
  } catch (e) {
    console.error("Failed to get wifi strength: ", e);
    return "network-wireless-symbolic";
  }
}

async function getNetworkIcon(status: string) {
  if (status.includes("wifi      connected")) {
    return getWifiStrengthIcon();
  } else if (status.includes("ethernet  connected")) {
    return "network-wired-symbolic"
  }

  return "network-disconnect-symbolic"
}

function QuickSettingsToggle() {
  const networkIcon = createPoll(
    "network-wireless-acquiring-symbolic",
    1000,
    () => {
      const status = exec("nmcli device status");;
      return getNetworkIcon(status);
    }
  );

  const bluetoothIcon = createPoll(
    "bluetooth-active-symbolic",
    1000,
    () => {
      const status = exec("bluetoothctl show");
      const connectedToDevice = exec("sh -c 'sh $HOME/.config/ags/scripts/check_bluetooth.sh'");

      if (status.includes("Discovering: yes")) {
        return "bluetooth-acquiring-symbolic";
      } else if (status.includes("Powered: yes")) {
        if (connectedToDevice === "true") {
          return "bluetooth-active-symbolic";
        } else {
          return "bluetooth-disconnected-symbolic";
        }
      } else {
        return "bluetooth-disabled-symbolic";
      }
    }
  );

  const microphoneIcon = createPoll(
    "audio-input-microphone-symbolic",
    1000,
    () => {
      const status = exec("pactl list source-outputs");
      return status.includes("Source") ? "audio-input-microphone-symbolic" : "";
    }
  );

  return (
    <menubutton class="menu-button" $type="end" halign={Gtk.Align.CENTER}>
      <box halign={Gtk.Align.CENTER} spacing={_spacing}>
        <Gtk.Image $type="end" iconName={microphoneIcon} valign={Gtk.Align.CENTER}/>
        <Gtk.Image $type="end" iconName={bluetoothIcon} valign={Gtk.Align.CENTER}/>
        <Gtk.Image $type="end" iconName={networkIcon} valign={Gtk.Align.CENTER}/>
        <Gtk.Image $type="end" iconName="system-shutdown-symbolic" valign={Gtk.Align.CENTER}/>
      </box>
      <popover>
      </popover>
    </menubutton>
  );
}

export default QuickSettingsToggle;