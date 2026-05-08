/** Searchable Linux / server command reference — basics, grep/sed/awk, Docker, Kubernetes, troubleshooting */

export interface LinuxCommandEntry {
  /** Primary command or pattern */
  cmd: string;
  /** Short explanation */
  desc: string;
  /** Copy-paste example */
  example: string;
}

export interface LinuxSection {
  id: string;
  title: string;
  intro: string;
  entries: LinuxCommandEntry[];
}

export const LINUX_SECTIONS: LinuxSection[] = [
  {
    id: "basics",
    title: "Shell & navigation",
    intro: "Everyday bash/zsh commands for moving around and inspecting files.",
    entries: [
      { cmd: "pwd", desc: "Print working directory", example: "pwd" },
      { cmd: "cd", desc: "Change directory", example: "cd /var/log && cd ~" },
      { cmd: "ls", desc: "List files — sizes, hidden, sort", example: "ls -lah --sort=size" },
      { cmd: "tree", desc: "Directory tree (install tree)", example: "tree -L 2 -d /etc" },
      { cmd: "mkdir / rmdir", desc: "Create or remove empty dir", example: "mkdir -p projects/app/{src,test}" },
      { cmd: "cp", desc: "Copy files — recursive, preserve attrs", example: "cp -a backup/. /restore/" },
      { cmd: "mv", desc: "Move or rename", example: "mv old.txt archive/new.txt" },
      { cmd: "rm", desc: "Remove — force, recursive (careful)", example: "rm -rf build_tmp/" },
      { cmd: "touch", desc: "Create empty file or bump mtime", example: "touch app.log && ls -l app.log" },
      { cmd: "cat / less / more", desc: "Read file — less is interactive", example: "less +F /var/log/syslog" },
      { cmd: "head / tail", desc: "First or last lines — follow log", example: "tail -n 100 -f /var/log/nginx/access.log" },
      { cmd: "wc", desc: "Count lines, words, bytes", example: "wc -l *.csv" },
      { cmd: "history", desc: "Past commands — rerun by number", example: "history | grep docker\n!42" },
      { cmd: "which / type / command -v", desc: "Where binary lives", example: "which python3; type -a ls" },
      { cmd: "alias", desc: "Shell shortcuts", example: "alias ll='ls -alh'" },
      { cmd: "diff / cmp", desc: "Compare files or dirs", example: "diff -u old.conf new.conf\ncmp -s bin1 bin2" },
      { cmd: "paste / join", desc: "Merge lines side-by-side or on key", example: "paste a.txt b.txt\njoin -t: file1 file2" },
    ],
  },
  {
    id: "view-files",
    title: "View files — line numbers & readable layout",
    intro:
      "Beyond raw cat: show code and configs with line numbers, paging, wrapping control, or syntax highlighting — without opening a full IDE.",
    entries: [
      {
        cmd: "cat -n / cat -b",
        desc: "Print file with line numbers (-n all lines, -b non-blank only)",
        example: "cat -n src/app.tsx\ncat -b ~/.bashrc | head -40",
      },
      {
        cmd: "nl",
        desc: "Number lines — widths and sections for readable dumps",
        example: "nl -ba nginx.conf | less\nnl -v10 -i10 log.txt   # start at 10, step 10",
      },
      {
        cmd: "less -N",
        desc: "Page through file with line numbers (toggle N inside less too)",
        example: "less -N /etc/ssh/sshd_config\nless -NS long.csv   # -S = chop long lines horizontally",
      },
      {
        cmd: "bat / batcat",
        desc: "Syntax-highlighted cat — line numbers, themes (install bat)",
        example: "bat package.json\nbat -n main.go\nbat --theme=GitHub --wrap=never README.md",
      },
      {
        cmd: "vim / vi",
        desc: "Editor — show line numbers; jump by line for quick inspection",
        example:
          "vim +\"set number\" config.yml\n:set nu\n:set relativenumber\n:42   # jump to line 42\n:set nowrap",
      },
      {
        cmd: "fold / fmt",
        desc: "Wrap long lines for readable terminal width",
        example: "fold -w 80 wide.txt\nfmt -w 72 memo.txt",
      },
      {
        cmd: "grep -n",
        desc: "Show line numbers when searching (pairs well with code review)",
        example: "grep -n \"function \" src/*.ts\ngrep -nR \"TODO\" . --include='*.go'",
      },
    ],
  },
  {
    id: "grep-text",
    title: "grep, sed, awk & pipelines",
    intro:
      "Search logs and configs, extract columns, and chain commands — essential for developers and platform engineers.",
    entries: [
      {
        cmd: "grep",
        desc: "Pattern search — recursive, line numbers, ignore case, invert match",
        example:
          "grep -Rni 'ERROR' /var/log/myapp\ngrep -E '50[0-9]|timeout' access.log\ngrep -v '^#' /etc/nginx/nginx.conf",
      },
      { cmd: "grep -E / egrep", desc: "Extended regex (alternation, groups)", example: "grep -E '(Failed|Invalid)' auth.log" },
      { cmd: "grep -o", desc: "Print only matching part (extract tokens)", example: "grep -oE '[0-9]{1,3}(\\.[0-9]{1,3}){3}' log.txt" },
      {
        cmd: "rg (ripgrep)",
        desc: "Very fast recursive search — respects .gitignore (install ripgrep)",
        example: "rg 'TODO|FIXME' src/\nrg -l 'import react' --type ts\nrg -n --hidden 'password'",
      },
      {
        cmd: "sed",
        desc: "Stream editor — substitute, delete lines, print range",
        example:
          "sed -i.bak 's/api\\.old/api.new/g' *.yaml\nsed -n '100,200p' huge.log\nsed '/^$/d' file.txt  # drop blank lines",
      },
      {
        cmd: "awk",
        desc: "Column/text processing — fields, sums, filters",
        example:
          "awk '{print $1,$NF}' access.log\nawk -F: '$3>=1000 {print $1}' /etc/passwd\nawk '{sum+=$1} END {print sum}' nums.txt",
      },
      {
        cmd: "xargs",
        desc: "Build command lines from stdin — parallel with -P",
        example:
          "find . -name '*.log' -mtime +7 | xargs gzip\nkubectl get pods -o name | xargs -I{} kubectl logs {} --tail=5\nxargs -a urls.txt -P4 curl -s -o /dev/null -w '%{url_effective}\\n'",
      },
      { cmd: "cut", desc: "Extract columns (often with logs)", example: "cut -d' ' -f1,7 access.log\ncut -c1-80 wide.txt" },
      { cmd: "tr", desc: "Translate/delete characters", example: "cat file | tr '[:upper:]' '[:lower:]'\ntr -d '\\r' < win.txt > unix.txt" },
      {
        cmd: "sort / uniq",
        desc: "Sort lines; count duplicates (uniq needs sorted input)",
        example: "sort -t: -k3 -n /etc/passwd\nsort ips.txt | uniq -c | sort -rn",
      },
      {
        cmd: "tee",
        desc: "Split stdout to file + terminal (audit pipelines)",
        example: "kubectl apply -f app.yaml 2>&1 | tee apply.log\n./deploy.sh | tee >(grep -i error >&2)",
      },
    ],
  },
  {
    id: "permissions",
    title: "Users, groups & permissions",
    intro: "chmod/chown and sudo patterns you see on real servers.",
    entries: [
      { cmd: "chmod", desc: "Change mode (numeric or symbolic)", example: "chmod 644 file.txt\nchmod u+x script.sh" },
      { cmd: "chown", desc: "Change owner and group", example: "sudo chown -R www-data:www-data /var/www" },
      { cmd: "umask", desc: "Default permission mask for new files", example: "umask 027" },
      { cmd: "sudo", desc: "Run as root — edit safely", example: "sudo -u postgres psql\nsudo visudo" },
      { cmd: "su", desc: "Switch user", example: "su - deploy\nsudo su -" },
      { cmd: "groups / id", desc: "Current user groups / UID", example: "id\ngroups $USER" },
      { cmd: "passwd", desc: "Change password", example: "passwd\nsudo passwd alice" },
      { cmd: "getfacl / setfacl", desc: "ACLs beyond chmod", example: "getfacl /shared\nsetfacl -m u:bob:rwx /shared" },
    ],
  },
  {
    id: "processes",
    title: "Processes & jobs",
    intro: "See what is running, stop runaway tasks, background work.",
    entries: [
      { cmd: "ps", desc: "Process snapshot — often aux / ef", example: "ps aux | grep nginx\nps -ef --forest" },
      { cmd: "top / htop", desc: "Live process monitor", example: "htop -u $USER" },
      { cmd: "pgrep / pidof", desc: "Find PID by name", example: "pgrep -af node\npidof sshd" },
      { cmd: "kill / killall", desc: "Signal processes — TERM then KILL", example: "kill -15 $PID\nkill -9 $PID  # last resort" },
      { cmd: "jobs / fg / bg", desc: "Shell background jobs", example: "sleep 100 &\njobs\nfg %1" },
      { cmd: "nohup", desc: "Survive logout", example: "nohup ./long_job.sh >out.log 2>&1 &" },
      { cmd: "nice / renice", desc: "CPU priority", example: "nice -n 10 heavy_cmd\nsudo renice -n -5 -p $PID" },
      { cmd: "timeout", desc: "Kill after duration", example: "timeout 30s curl -v slow.api/health" },
      { cmd: "watch", desc: "Re-run command periodically", example: "watch -n2 'df -h /'" },
      { cmd: "systemctl status", desc: "Check service state (systemd)", example: "systemctl status nginx\nsystemctl is-active docker" },
      {
        cmd: "systemctl list-units",
        desc: "List units — failed, timers, running services",
        example:
          "systemctl list-units --failed\nsystemctl list-units --type=service --state=running\nsystemctl list-timers",
      },
      { cmd: "crontab", desc: "User cron jobs — edit or list", example: "crontab -l\ncrontab -e\nsudo crontab -l -u www-data" },
    ],
  },
  {
    id: "networking",
    title: "Networking",
    intro: "Connectivity, DNS, HTTP — typical checks from a shell.",
    entries: [
      { cmd: "curl", desc: "HTTP(S) client — headers, methods", example: "curl -I https://example.com\ncurl -d '{}' -H 'Content-Type: application/json' URL" },
      { cmd: "wget", desc: "Download files", example: "wget -O file.zip https://cdn/file.zip" },
      { cmd: "ssh / scp / sftp", desc: "Remote shell and copy", example: "ssh user@host\nscp file user@host:/tmp/" },
      { cmd: "ping", desc: "ICMP reachability", example: "ping -c 4 1.1.1.1" },
      { cmd: "traceroute / tracepath", desc: "Route hops", example: "traceroute example.com" },
      { cmd: "dig / nslookup / host", desc: "DNS lookup", example: "dig +short A api.example.com\nhost -t MX example.com" },
      { cmd: "ss", desc: "Sockets — replacement for netstat", example: "ss -tlnp\nss -tan sport = :443" },
      { cmd: "netstat", desc: "Legacy socket listing", example: "netstat -tulpn 2>/dev/null | grep LISTEN" },
      { cmd: "nc (netcat)", desc: "TCP/UDP probe", example: "nc -vz db.internal 5432\ncat foo | nc host 1234" },
      { cmd: "iptables / nft", desc: "Firewall rules (root)", example: "sudo iptables -L -n -v\nsudo nft list ruleset" },
      { cmd: "ip / ifconfig", desc: "Interfaces & routes", example: "ip addr show\nip route\nip link set eth0 up" },
      { cmd: "mtr", desc: "Ping + traceroute combined", example: "mtr -rwzbc 100 example.com" },
      {
        cmd: "openssl s_client",
        desc: "TLS handshake & cert inspection — debug HTTPS",
        example:
          "openssl s_client -connect api.example.com:443 -servername api.example.com </dev/null\nopenssl s_client -showcerts -connect host:443 2>/dev/null | openssl x509 -noout -dates",
      },
      { cmd: "whois", desc: "Domain / IP registration lookup", example: "whois example.com\nwhois 203.0.113.9" },
      { cmd: "resolvectl / systemd-resolve", desc: "DNS resolver status (systemd)", example: "resolvectl status\nresolvectl query api.example.com" },
    ],
  },
  {
    id: "disk-memory",
    title: "Disk & memory",
    intro: "Space running out or RAM pressure — quick diagnostics.",
    entries: [
      { cmd: "df", desc: "Filesystem space", example: "df -h\n df -h /var" },
      { cmd: "du", desc: "Directory sizes", example: "du -sh *\nsudo du -xh /var | sort -rh | head" },
      { cmd: "lsblk / blkid", desc: "Block devices & UUIDs", example: "lsblk -f\nsudo blkid" },
      { cmd: "mount / umount", desc: "Attach filesystems", example: "mount | column -t\nsudo mount /dev/sdb1 /mnt" },
      { cmd: "free", desc: "RAM and swap", example: "free -h\nwatch -n1 free -h" },
      { cmd: "/proc/meminfo", desc: "Detailed memory stats", example: "grep -E 'Mem|Swap' /proc/meminfo" },
      { cmd: "sync", desc: "Flush writes before unplug/remount", example: "sync && sudo umount /usb" },
      { cmd: "find … -mtime / -size", desc: "Large or old files", example: "find /var/log -type f -size +100M\nfind . -mtime +30" },
      { cmd: "ncdu", desc: "Interactive disk usage browser (install ncdu)", example: "ncdu /\nncdu -x /var" },
      { cmd: "iotop", desc: "Per-process disk IO (install iotop)", example: "sudo iotop -oPa  # only active, accum, all processes" },
    ],
  },
  {
    id: "troubleshooting",
    title: "Logs & debugging",
    intro: "When something breaks on the server — follow the trail.",
    entries: [
      { cmd: "journalctl", desc: "systemd logs — boot, unit, follow", example: "journalctl -u nginx -f --since '1 hour ago'\njournalctl -b -p err" },
      { cmd: "dmesg", desc: "Kernel ring buffer — hardware / OOM", example: "dmesg -T | tail -50\ndmesg | grep -i oom" },
      { cmd: "strace", desc: "Syscall trace (slow, noisy)", example: "strace -p $PID -f -e trace=network" },
      {
        cmd: "lsof",
        desc: "List open files, ports, memory-mapped libs — find who listens on a port",
        example:
          "sudo lsof -iTCP:443 -sTCP:LISTEN\nsudo lsof -i :8080\nsudo lsof -p $PID\nsudo lsof +D /var/log 2>/dev/null | head",
      },
      {
        cmd: "fuser",
        desc: "Report PIDs using file, socket, or filesystem",
        example: "sudo fuser -v 443/tcp\nsudo fuser -km /mnt/stale   # kill holders — careful",
      },
      { cmd: "perf", desc: "Linux profiler — CPU hotspots (needs perf package)", example: "sudo perf top -p $PID\nsudo perf record -g -p $PID sleep 15 && sudo perf report" },
      { cmd: "gdb", desc: "Attach to running process — stack traces", example: "sudo gdb -p $PID -batch -ex 'thread apply all bt' -ex q" },
      { cmd: "tcpdump", desc: "Packet capture", example: "sudo tcpdump -i any port 443 -nn -c 20" },
      { cmd: "sar / iostat / vmstat", desc: "Historical CPU, IO, memory", example: "iostat -xz 1\nvmstat 1 5" },
      { cmd: "ss -s", desc: "Socket summary stats", example: "ss -s" },
      { cmd: "uptime / w", desc: "Load average & who is logged in", example: "uptime\nw" },
      { cmd: "last / lastb", desc: "Login history / failed logins", example: "last -10\nsudo lastb | head" },
    ],
  },
  {
    id: "docker",
    title: "Docker",
    intro: "Containers — images, runs, compose, cleanup.",
    entries: [
      { cmd: "docker ps", desc: "Running containers — all & sizes", example: "docker ps -a\ndocker ps -s" },
      { cmd: "docker images", desc: "Local images", example: "docker images\ndocker image prune -a" },
      { cmd: "docker pull / push / build", desc: "Registry & Dockerfile build", example: "docker build -t myapp:1 .\ndocker push registry/myapp:1" },
      { cmd: "docker run", desc: "Start container — ports, env, detach", example: "docker run -d -p 8080:80 --name web nginx\ndocker run -it --rm alpine sh" },
      { cmd: "docker exec", desc: "Shell inside running container", example: "docker exec -it web bash" },
      { cmd: "docker logs", desc: "Stdout/stderr — follow", example: "docker logs -f --tail 100 web" },
      { cmd: "docker inspect", desc: "Full JSON metadata", example: "docker inspect -f '{{.NetworkSettings.IPAddress}}' web" },
      { cmd: "docker stats", desc: "Live CPU/mem per container", example: "docker stats --no-stream" },
      { cmd: "docker compose", desc: "Multi-service stacks", example: "docker compose up -d\ndocker compose logs -f api" },
      { cmd: "docker network / volume", desc: "Networks & named volumes", example: "docker network ls\ndocker volume prune" },
      { cmd: "docker system prune", desc: "Remove unused data — careful", example: "docker system df\ndocker system prune -a" },
    ],
  },
  {
    id: "kubernetes",
    title: "Kubernetes (kubectl)",
    intro: "Minimum kubectl you need to inspect and fix clusters.",
    entries: [
      { cmd: "kubectl get", desc: "List resources — wide, all namespaces", example: "kubectl get pods -A\nkubectl get nodes -o wide" },
      { cmd: "kubectl describe", desc: "Events & reasons for failures", example: "kubectl describe pod mypod -n prod" },
      { cmd: "kubectl logs", desc: "Pod logs — previous crash", example: "kubectl logs deploy/api -f --tail=200\nkubectl logs pod/x -p" },
      { cmd: "kubectl exec", desc: "Shell in pod", example: "kubectl exec -it mypod -n prod -- /bin/sh" },
      { cmd: "kubectl apply", desc: "Declarative apply", example: "kubectl apply -f manifest.yaml\nkubectl apply -k overlays/dev" },
      { cmd: "kubectl delete", desc: "Remove resources", example: "kubectl delete pod stuck-pod --force --grace-period=0" },
      { cmd: "kubectl port-forward", desc: "Local tunnel to pod/service", example: "kubectl port-forward svc/grafana 3000:3000" },
      { cmd: "kubectl rollout", desc: "Deployments — status, undo", example: "kubectl rollout status deploy/api\nkubectl rollout undo deploy/api" },
      { cmd: "kubectl config", desc: "Contexts & kubeconfig", example: "kubectl config use-context staging\nkubectl config get-contexts" },
      { cmd: "kubectl top", desc: "Metrics (needs metrics-server)", example: "kubectl top pods\nkubectl top nodes" },
      { cmd: "kubectl get events", desc: "Cluster events stream", example: "kubectl get events -n prod --sort-by=.lastTimestamp" },
      {
        cmd: "helm",
        desc: "Kubernetes packages — releases & upgrades (install Helm)",
        example: "helm list -A\nhelm upgrade --install mychart ./chart -n prod\nhelm rollback myrelease 1 -n prod",
      },
    ],
  },
  {
    id: "packages",
    title: "Packages (apt / yum / rpm)",
    intro: "Install and inspect software on Debian/Ubuntu, RHEL/CentOS/Fedora, and SuSE-style systems.",
    entries: [
      {
        cmd: "apt / apt-get",
        desc: "Debian/Ubuntu packages — update index, install, search",
        example: "sudo apt update && sudo apt upgrade -y\nsudo apt install -y nginx curl\napt-cache search postgres",
      },
      {
        cmd: "dpkg / apt-file",
        desc: "Inspect .deb packages — which file belongs to which package",
        example: "dpkg -l | grep nginx\ndpkg -L nginx\nsudo apt-file search bin/jpegtran",
      },
      {
        cmd: "yum / dnf",
        desc: "RHEL/CentOS/Fedora packages — install, group list",
        example: "sudo dnf install -y git\nsudo dnf upgrade --refresh\nsudo yum repolist all",
      },
      {
        cmd: "rpm",
        desc: "RPM query — list files, verify, last install",
        example: "rpm -qa | grep kernel\nrpm -ql nginx\nrpm -qi bash\nrpm -qf /usr/bin/python3",
      },
      {
        cmd: "snap / flatpak",
        desc: "Universal packages — sandboxed apps",
        example: "snap list\nsudo snap install kubectl --classic\nflatpak remote-ls | head",
      },
    ],
  },
  {
    id: "archives-sync",
    title: "Archives & rsync",
    intro: "Ship configs, logs, and artifacts — tarball, compress, and incremental sync.",
    entries: [
      {
        cmd: "tar",
        desc: "Tape archive — create/extract .tar, combine with gzip/xz",
        example:
          "tar czf backup.tgz /etc/nginx\ntar xzf release.tar.gz\ntar tvf backup.tar | head",
      },
      { cmd: "gzip / gunzip / zcat", desc: "Compress single files — gzip keeps timestamp", example: "gzip -k big.log\nzcat access.log.gz | head" },
      { cmd: "zip / unzip", desc: "PKZIP archives — common on Windows exchanges", example: "zip -r dist.zip build/\nunzip -l archive.zip" },
      {
        cmd: "rsync",
        desc: "Incremental copy — deploys, backups, preserve perms",
        example:
          "rsync -avz ./site/ user@host:/var/www/\nrsync -av --delete src/ backup/src/\nrsync -e ssh -avz data/ backup-host:/data/",
      },
    ],
  },
  {
    id: "git-env",
    title: "Git, env & shells",
    intro: "Version control quick hits and environment inspection for CI/CD and debugging.",
    entries: [
      { cmd: "git", desc: "Clone, diff, history — daily workflow", example: "git clone https://github.com/org/repo.git\ngit status\ngit log -3 --oneline\ngit diff --stat origin/main" },
      { cmd: "env / printenv", desc: "Show environment variables", example: "env | sort\nprintenv PATH\nexport MY_VAR=test" },
      { cmd: "ssh-keygen / ssh-agent", desc: "Keys for Git & SSH", example: "ssh-keygen -t ed25519 -C 'you@company.com'\neval $(ssh-agent) && ssh-add ~/.ssh/id_ed25519" },
    ],
  },
  {
    id: "cloud-infra",
    title: "AWS CLI & Terraform",
    intro: "Identity checks and infra workflows when cloud CLIs are installed on the bastion or CI runner.",
    entries: [
      {
        cmd: "aws",
        desc: "AWS CLI — STS identity, EC2, S3, CloudWatch logs tail",
        example:
          "aws sts get-caller-identity\naws configure list\naws ec2 describe-instances --filters Name=tag:Env,Values=prod --query ...\naws logs tail /ecs/my-service --since 10m --follow",
      },
      {
        cmd: "terraform",
        desc: "Plan and apply infrastructure as code",
        example: "terraform fmt -recursive\nterraform init\nterraform plan -out=tfplan\nterraform apply tfplan",
      },
      {
        cmd: "jq",
        desc: "JSON filter — pipe kubectl/aws output",
        example: "kubectl get pods -o json | jq '.items[].metadata.name'\naws ec2 describe-instances | jq '.Reservations[].Instances[].InstanceId'",
      },
    ],
  },
];

export function flattenCommandsForSearch(): { sectionId: string; sectionTitle: string; entry: LinuxCommandEntry }[] {
  return LINUX_SECTIONS.flatMap((s) =>
    s.entries.map((entry) => ({ sectionId: s.id, sectionTitle: s.title, entry })),
  );
}
