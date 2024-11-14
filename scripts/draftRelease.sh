#!/usr/bin/env bash
# draftRelease.sh by Amory Meltzer, 2020
# Licensed under the WTFPL http://www.wtfpl.net/
# Collect draft of items to announce at WT:TW


# When double quoted, * means IFS separation and @ means word
# Keep that in mind lest ye go mad

function usage {
	cat <<END_USAGE
Usage: $(basename "$0") prior_commit_sha [ending_commit_sha]

Requires a valid commit that identifies the final commit of the previous release, i.e. the last commit not included in this list.

Probably most useful when redirected to a temporary file, such as \`$0 HEAD~42 > 2020-01-01.wikitext\`, as it will need sorting, editing, and formatting.

An optional second commit can be used to identify the ending commit, i.e. the last commit to include in this list.  Default is HEAD.
END_USAGE
}

while getopts 'hH' opt; do
	case $opt in
		h|H) usage "$0"
		     exit 0;;
	esac
done

# The readarray below implies bash>=4, which is not/will never be the default
# on OS X/macOS, but everyone should be on it anyway. If we wanted to make it
# fine on bash v3, this would have to be converted to something like
### log=$(git log --no-merges --topo-order --reverse --format="%H;;%an;;%s" HEAD~6..HEAD -- . ":(glob)**/*.*s")
### IFS=$'\n' log=($log)
# and would also require parsing out mergeParents for the merge-base call, as
# the space between the %P parents throws a wrench in the whole thang.
# Likewise, we could do
### while IFS='\n' read log;
### ...
### done < <(git log --no-merges --topo-order --reverse --format="%H;;%an;;%s" $prior..$end -- . ":(glob)**/*.*s")
if [[ "${BASH_VERSINFO[0]}" -lt 4 ]]; then
	echo "bash version 4 or greater is required"
	exit 1
fi


# Parse arguments, ensure at least one is given, and either are valid objects
# Could use commit but -e/-t allows for tags
prior=$1
if ! git cat-file -e "$prior" &>/dev/null; then
	echo "$0 needs a valid object"
	exit 1;
fi
end='HEAD'
if git cat-file -e "$2" &>/dev/null; then
	end=$2
fi

# Run from toplevel, matters for glob
top="$(git rev-parse --show-toplevel 2>/dev/null)"
if [[ -d "$top" ]]; then
	cd "$top"
else
	echo "Unable to find top-level directory"
	exit 1;
fi

# Limit to js and css files; include author and message for later use, uniquely separated
# Should probably be better about excluding pathspecs
readarray -t log < <(git log --no-merges --topo-order --reverse --format="%H;;%an;;%s" "$prior".."$end" . ":(glob)**/*.s" ":(exclude)*.json" ":(exclude)scripts/**" ":(exclude)tests/**" ":(exclude).github/**")
for item in "${log[@]}"; do
	sha="${item%%';;'*}"

	files=$(git diff --name-only "$sha~" "$sha")
	if [[ -z "$files" ]]; then
		continue
	fi

	# Clean up a bit
	files=$(echo "$files" | sed 's/modules\///' | perl -pe 's/(?:twinkle)?\B(.+)\.(?:j|cs)s$/$1/' | sort | uniq)

	item="${item#*';;'}"
	author="${item%';;'*}"
	message="${item#*';;'}"

	# Don't transclude templates
	message="${message//{{/{{tl|}"

	# Multiple files edited
	# Should probably be updated to sort module+twinkleconfig under module
	if [[ $(echo "$files" | wc -l | tr -d ' ') -gt 1 ]]; then
		files=$(echo -n "$files" | tr -u '\n' ' ')
		files="Multiple ($files)"
	else
		# Remove likely repetitive file prefix
		message="${message/$files: }"
		# Rename some confusing modules
		files="${files/fluff/revert and rollback}"
		files="${files/config/prefs}"
	fi

	# Find the associated merge commit and grep the GitHub PR number for linking
	info=''
	pr=''
	# Try to process squash-merge items first
	if [[ "$message" =~ "(#"[[:digit:]]+")" ]]; then
		pr=$(grep -o "(#\d\+)" <<< "$message" | grep -o "\d\+")
		# Cleanup message
		message="${message/ (#$pr)}"
	else
		# -n is processed before things like --reverse, so we need to pipe to head
		merge=$(git log "$sha".."$end" --ancestry-path --merges --reverse --format='%H;;%s;;%P' | head -n 1)
		if [[ -n "$merge" ]]; then
			mergeCommit="${merge%%';;'*}"
			merge="${merge#*';;'}"
			mergeMessage="${merge%';;'*}" # technically unnecessary...
			mergeParents="${merge#*';;'}"
			# The ancestry-path check isn't sufficient, as commits directly
			# commited to master (i.e. not part of a PR/merge) will report the
			# prior merge commit.  This monstrosity:
			# 1. Uses the parents of the merge commit (%P from above)
			# 2. Finds the common base of those parents (merge-base)
			# 3. Lists all the commits from the base to the merge commit (log..$mergeCommit)
			# 4. Checks if our sha is in that list
			# It's roundabout and ugly but I don't know a simpler or
			# faster way without introducing some errors
			if [[ -n $(git log $(git merge-base --octopus $mergeParents)..$mergeCommit --oneline --no-abbrev-commit | grep "$sha") ]]; then
				# Merge via GitHub, typical
				pr=$(grep -o "Merge pull request \#\d\+" <<< "$mergeMessage" | grep -o "\d\+")
				# Merge via terminal, assumes a branch prefixed with the repo PR number (e.g. "666-")
				if [[ -z "$pr" ]]; then
					pr=$(grep -o "Merge branch \'\d\+-" <<< "$mergeMessage" | grep -o "\d\+")
				fi
			fi
		fi
	fi

	if [[ -n "$pr" ]]; then
		info="[https://github.com/wikimedia-gadgets/twinkle/pull/$pr #$pr]"
	fi

	# Avoid ego padding
	author="${author/$(git config user.name)/}"
	# Make a user link
	if [[ -n "$author" ]]; then
		# Convert unusual suspects
		lcauthor="${author,,}"
		if [[ "$lcauthor" =~ "siddharth vp" ]]; then
			author="SD0001"
		elif [[ "$lcauthor" =~ "michael daniels" ]]; then
			author="Mdaniels5757"
		elif [[ "$lcauthor" =~ "ankit" ]]; then
			author="QEDK"
		fi
		author="[[User:$author|$author]]"

		if [[ -n "$info" ]]; then
			info="$info, "
		fi
		info="$info""by $author"
	fi

	# Dump into an array for sorting
	results+=("*$files: $message${info:+ ($info)}")
done

# Sort and print results, grouped by module
IFS=$'\n' results=($(sort <<<"${results[*]}"))
dupes=$(cut -f 1 -d ':' <<<"${results[*]}" | sort | uniq -d)
prior=''
for x in "${results[@]}"; do
	file=$(cut -f 1 -d ':' <<<"${x}")
	# Group items under headings
	grep=$(grep "${file}" <<<"${dupes[@]}")
	if [[ -n "$grep" ]]; then
		line="${x/\*${file}: /}"
		if [ "$file" != "$prior" ]; then
			echo "${file}:"
		fi
		echo "**${line}"
	else
		echo "${x}"
	fi
	# Set for next round
	prior=$file
done
