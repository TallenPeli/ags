import { Astal, Gtk } from "ags/gtk4";
import { exec, execAsync } from "ags/process"
import { createPoll } from "ags/time";
import AstalWp from "gi://AstalWp?version=0.1";

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
  } catch (error) {
    console.error("Failed to get wifi strength: ", error);
    return "network-wireless-offline-symbolic";
  }
}

function MicrophoneIndicator() {
  const microphoneIcon = createPoll(
    "",
    1000,
    async() => {
      try {
        const sourceOutputs = await execAsync("pactl list source-outputs");
        const isInUse = sourceOutputs.includes("Source");

        if (!isInUse) {
          return "";
        }

        const sourceInfo = await execAsync("pactl get-source-mute @DEFAULT_SOURCE@");
        const isMuted = sourceInfo.includes("yes");

        return isMuted ? "microphone-disabled-symbolic" : "audio-input-microphone-symbolic";

      } catch (error) {
        print(`Error getting microphone status: ${error}`);
        return "";
      }
    }
  );

  return (
    <Gtk.Image
      iconName={microphoneIcon}
      visible={microphoneIcon.as(icon => icon !== "")}
      class="microphone-indicator"
    />
  );
}

function BluetoothIndicator() {
  const bluetoothIcon = createPoll(
    "bluetooth-active-symbolic",
    1000,
    async() => {
      try {
        const status = await execAsync("bluetoothctl show");
        const connectedToDevice = exec("sh -c 'sh $HOME/.config/ags/scripts/check_bluetooth.sh'");

        if (status.includes("Discovering: yes")) {
          return "bluetooth-acquiring-symbolic";
        } else if (status.includes("Powered: yes")) {
          if (connectedToDevice === "true") {
            return "bluetooth-active-symbolic";
          }
        }
        return "";
      } catch (error) {
        print(`Error getting bluetooth status: ${error}`);
        return "";
      }
    }
  );

  return (
    <Gtk.Image
      iconName={bluetoothIcon}
      visible={bluetoothIcon.as(icon => icon !== "")}
    />
  );
}

function NetworkIndicator() {
  const networkIcon = createPoll(
    { icon: "network-wireless-acquiring-symbolic", device: "" },
    1000,
    async () => {
      try {
        const status = await execAsync("nmcli -t -f DEVICE,TYPE,STATE device");
        const lines = status.split("\n");

        // Check for VPN connections
        for (const line of lines) {
          const [device, type, state] = line.split(":");

          if (state === "connected" && (type === "tun" || type === "vpn" || type === "wireguard")) {
              return { icon: "network-vpn-symbolic", device };
          }
        }

        // Check ethernet
        for (const line of lines) {
          const [device, type, state] = line.split(":");
          if (type === "ethernet") {
            if (state === "connected") {
              return { icon: "network-wired-symbolic", device };
            }
          }
        }

        // Then check for wifi
        for (const line of lines) {
          const [device, type, state] = line.split(":");
          if (type === "wifi") {
            if (state === "connected") {
              return { icon: await getWifiStrengthIcon(), device };
            } else {
              return { icon: "network-wireless-offline-symbolic", device };
            }
          }
        }

        // Final fallback if you have no wifi device, but you have an ethernet device
        for (const line of lines) {
          const [device, type, state] = line.split(":");
          if (type === "ethernet" && state === "disconnected") {
            return { icon: "network-wired-offline-symbolic", device };
          }
        }

        return { icon: "", device: "" };
      } catch (error) {
        print(`Error getting network status: ${error}`);
        return { icon: "", device: "" };
      }
    }
  );

  return (
    <Gtk.Image
      iconName={networkIcon.as(n => n.icon)}
      tooltipText={networkIcon.as(n => n.device)}
      visible={networkIcon.as(n => n.icon !== "")}
    />
  );
}

function AudioIndicator() {
  const audioIcon = createPoll(
    "audio-card-symbolic",
    1000,
    () => {
      const defaultSpeaker = AstalWp.get_default().get_default_speaker();
      if (defaultSpeaker === null) {
        return ""; 
      }

      if (defaultSpeaker.get_icon().includes("headset")) {
        return "audio-headset-symbolic";
      }

      return defaultSpeaker.get_icon();
    }
  );

  const isVisible = createPoll (
    false,
    1000,
    () => {
      const defaultSpeaker = AstalWp.get_default().get_default_speaker();
      if (defaultSpeaker === null) {
        return false;
      }
      return true;
    }
  );

  return (
    <Gtk.Image
      iconName={audioIcon}
      visible={isVisible}
    />
  );
}

function QuickSettingsToggle() {
  return (
    <menubutton class="menu-button" $type="end" halign={Gtk.Align.CENTER}>
      <box halign={Gtk.Align.CENTER} spacing={_spacing}>
        <MicrophoneIndicator />
        <NetworkIndicator />
        <BluetoothIndicator />
        <AudioIndicator />
        <Gtk.Image $type="end" iconName="system-shutdown-symbolic" valign={Gtk.Align.CENTER}/>
      </box>
      <popover>
      </popover>
    </menubutton>
  );
}

export default QuickSettingsToggle;