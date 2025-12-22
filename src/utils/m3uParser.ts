export interface M3UChannel {
  name: string;
  url: string;
  group?: string;
  logo?: string;
}

export const parseM3U = (content: string): M3UChannel[] => {
  const lines = content.split('\n');
  const channels: M3UChannel[] = [];
  let currentChannel: Partial<M3UChannel> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      // Parse metadata
      const info = line.substring(8);
      const parts = info.split(',');
      
      // Get name from the last part
      let name = parts[parts.length - 1].trim();
      
      // Try to extract attributes
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);

      if (tvgNameMatch && tvgNameMatch[1]) {
          name = tvgNameMatch[1];
      }

      currentChannel = {
        name: name,
        logo: logoMatch ? logoMatch[1] : undefined,
        group: groupMatch ? groupMatch[1] : undefined
      };
    } else if (!line.startsWith('#')) {
      // It's a URL
      if (currentChannel.name) {
        channels.push({
          ...currentChannel,
          url: line
        } as M3UChannel);
        currentChannel = {};
      }
    }
  }

  return channels;
};
